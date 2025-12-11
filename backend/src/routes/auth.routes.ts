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

    // Проверка подписи initData
    if (!validateTelegramInitData(initData, botToken)) {
      return res.status(401).json({ error: 'Invalid initData signature' });
    }

    // Парс Telegram данных
    const { user: telegramUser } = parseTelegramInitData(initData);

    if (!telegramUser?.id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const tgId = BigInt(telegramUser.id);

    // Ищем пользователя по tg_id
    let user = await prisma.user.findUnique({
      where: { tg_id: tgId },
      include: { profile: true },
    });

    if (!user) {
      // Создаём пользователя + профиль (профиль обязателен)
      user = await prisma.user.create({
        data: {
          tg_id: tgId,
          authProvider: "telegram",
          profile: {
            create: {
              // Пока создаём пустой профиль
              displayName: telegramUser.first_name ?? null,
            },
          },
        },
        include: { profile: true },
      });
    }

    // Генерация JWT
    const token = generateToken({
      userId: user.id,
      tgId: tgId.toString(),
    });

    return res.json({
      token,
      user: {
        id: user.id,
        tgId: user.tg_id.toString(),
        profile: user.profile,
      },
    });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRouter };
