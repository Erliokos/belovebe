import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Все роуты требуют аутентификации
router.use(authMiddleware);

/**
 * GET /api/profile
 * Получить профиль текущего пользователя
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      tgId: user.tg_id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      language: user.language,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/profile
 * Обновить профиль пользователя
 */
router.patch('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { preferredCity, preferredCountry, language } = req.body;

    // Обновляем язык пользователя
    if (language !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { language },
      });
    }

    // Обновляем профиль
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(preferredCity !== undefined && { preferredCity }),
        ...(preferredCountry !== undefined && { preferredCountry }),
      },
      create: {
        userId,
        rating: 0.0,
        completedTasks: 0,
        currentTasks: 0,
        preferredCity: preferredCity || null,
        preferredCountry: preferredCountry || null,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    res.json({
      id: user!.id,
      tgId: user!.tg_id.toString(),
      firstName: user!.firstName,
      lastName: user!.lastName,
      username: user!.username,
      language: user!.language,
      profile: user!.profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as profileRouter };

