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
      email: user.email,
      phone: user.phone,
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
    const {
      displayName,
      birthdate,
      gender,
      genderPreferences,
      bio,
      city,
      country,
      lat,
      lng,
    } = req.body;

    // Обновляем профиль
    const profile = await prisma.profile.upsert({
      where: { id: userId }, // id профиля = id пользователя
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(birthdate !== undefined && { birthdate: new Date(birthdate) }),
        ...(gender !== undefined && { gender }),
        ...(genderPreferences !== undefined && { genderPreferences }),
        ...(bio !== undefined && { bio }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
      },
      create: {
        id: userId,
        displayName: displayName || null,
        birthdate: birthdate ? new Date(birthdate) : null,
        gender: gender || null,
        genderPreferences: genderPreferences || [],
        bio: bio || null,
        city: city || null,
        country: country || null,
        lat: lat || null,
        lng: lng || null,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    res.json({
      id: user!.id,
      tgId: user!.tg_id.toString(),
      email: user!.email,
      phone: user!.phone,
      profile: user!.profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as profileRouter };
