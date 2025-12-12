import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { getDistance } from '../utils/utils';

const router = Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// GET /discover
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // берем из JWT
    const limit = Number(req.query.limit) || 20;
    const skip = Number(req.query.skip) || 0;

    console.log('userId', userId);
    console.log('limit', limit);
    console.log('skip', skip);
    

    // 1. Загружаем профиль текущего пользователя
    const me = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        user: true,
      },
    });

    console.log('me', me);
    

    if (!me) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // 2. Список ID, которых исключить:
    // - я заблокировал
    // - заблокировали меня
    const blocked = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      },
    });

    console.log('blocked', blocked);

    const blockedIds = blocked.map(b =>
      b.blockerId === userId ? b.blockedId : b.blockerId
    );

    // 3. Кого я уже лайкал / пасс / суперлайк
    const myLikes = await prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    console.log('myLikes', myLikes);
    

    const likedIds = myLikes.map(l => l.toUserId);

    // 4. Тех, кто лайкнул меня (не показываем повторно)
    const incomingLikes = await prisma.like.findMany({
      where: { toUserId: userId },
      select: { fromUserId: true },
    });

    const incomingLikeIds = incomingLikes.map(l => l.fromUserId);

    // 5. Подбор кандидатов
    const candidates = await prisma.profile.findMany({
      where: {
        id: {
          notIn: [
            userId!,
            ...blockedIds,
            ...likedIds,
            ...incomingLikeIds,
          ],
        },
        // фильтр по полу
        gender: {
          in: me.genderPreferences.length > 0
            ? me.genderPreferences
            : undefined,
        },
        // опциональный фильтр по городу / стране
        country: me.country || undefined,
        // фильтрация по возрасту напрямую не делается — нужно считать далее
      },
      include: {
        photos: {
          where: { moderatedStatus: "APPROVED" },
          take: 1,
        },
      },
      skip,
      take: limit * 5, // берем шире, потом срежем по расстоянию/возрасту
    });

    console.log('candidates', candidates);
    

    // 6. Фильтры возраста и расстояния
    const ageMin = Number(req.query.ageMin) || 0;
    const ageMax = Number(req.query.ageMax) || 99;
    const maxDistance = Number(req.query.maxDistance) || 50000; // км

    const now = new Date();

    const filtered = candidates.filter(p => {
      // фильтр возраста
      if (p.birthdate) {
        const age =
          now.getFullYear() - p.birthdate.getFullYear() -
          (now < new Date(now.getFullYear(), p.birthdate.getMonth(), p.birthdate.getDate()) ? 1 : 0);

        if (age < ageMin || age > ageMax) return false;
      }

      // фильтр расстояния (если есть координаты)
      if (p.lat && me.lat && p.lng && me.lng) {
        const dist = getDistance(me.lat, me.lng, p.lat, p.lng);
        if (dist > maxDistance) return false;
      }

      // минимум 1 фото
      // if (p.photos.length === 0) return false;

      return true;
    });

    // 7. Отдаем ограниченное количество
    res.json({
      count: filtered.length,
      users: filtered.slice(0, limit),
    });

  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export { router as discoverRouter};
