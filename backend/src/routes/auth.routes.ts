import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateTelegramInitData, parseTelegramInitData } from '../utils/telegram';
import { generateToken } from '../utils/jwt';

const router = Router();
const prisma = new PrismaClient();

interface TelegramAuthRequest extends Request {
  body: {
    initData: string;
  };
}

/**
 * @swagger
 * /api/auth/telegram:
 *   post:
 *     summary: Аутентификация через Telegram
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - initData
 *             properties:
 *               initData:
 *                 type: string
 *                 description: initData от Telegram Web App
 *     responses:
 *       200:
 *         description: Успешная аутентификация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Неверная подпись initData
 */
router.post('/telegram', async (req: TelegramAuthRequest, res: Response) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Валидация initData
    if (!validateTelegramInitData(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid initData signature' });
    }

    // Парсинг данных пользователя
    const { user: telegramUser } = parseTelegramInitData(initData);

    console.log('telegramUser', telegramUser);
    

    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const tgId = BigInt(telegramUser.id);
    // Получаем язык пользователя (например, 'ru', 'en', 'uk')
    const languageCode = telegramUser.language_code 
      ? telegramUser.language_code.split('-')[0] // Берем только код языка (ru-RU -> ru)
      : null;

    // Поиск или создание пользователя
    let user = await prisma.user.findUnique({
      where: { tg_id: tgId },
      include: { profile: true },
    });

    if (!user) {
      // Создание нового пользователя
      user = await prisma.user.create({
        data: {
          tg_id: tgId,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          username: telegramUser.username || null,
          isBot: telegramUser.is_bot || false,
          language: languageCode,
          profile: {
            create: {
              rating: 0.0,
              completedTasks: 0,
              currentTasks: 0,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // Обновление данных существующего пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: telegramUser.first_name || user.firstName,
          lastName: telegramUser.last_name || user.lastName,
          username: telegramUser.username || user.username,
          isBot: telegramUser.is_bot ?? user.isBot,
        },
        include: { profile: true },
      });
    }

    // Генерация JWT токена
    const token = generateToken({
      userId: user.id,
      tgId: tgId.toString(),
      username: user.username || undefined,
    });

    res.json({
      token,
      user: {
        id: user.id,
        tgId: user.tg_id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        language: user.language,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRouter };

