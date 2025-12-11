import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Все роуты требуют аутентификации
router.use(authMiddleware);

/**
 * GET /api/filters
 * Получить фильтры пользователя
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    let userFilters = await prisma.userFilters.findUnique({
      where: { userId },
    });

    // Если фильтров нет, создаем дефолтные
    if (!userFilters) {
      userFilters = await prisma.userFilters.create({
        data: {
          userId,
          selectedCategories: [],
          selectedCountries: [],
          selectedCities: [],
          worldwideMode: false,
        },
      });
    }

    res.json({
      selectedCategories: userFilters.selectedCategories || [],
      selectedCountries: userFilters.selectedCountries || [],
      selectedCities: userFilters.selectedCities || [],
      worldwideMode: userFilters.worldwideMode,
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/filters
 * Сохранить фильтры пользователя
 */
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { selectedCategories, selectedCountries, selectedCities, worldwideMode } = req.body;

    const userFilters = await prisma.userFilters.upsert({
      where: { userId },
      update: {
        selectedCategories: selectedCategories || [],
        selectedCountries: selectedCountries || [],
        selectedCities: selectedCities || [],
        worldwideMode: Boolean(worldwideMode),
      },
      create: {
        userId,
        selectedCategories: selectedCategories || [],
        selectedCountries: selectedCountries || [],
        selectedCities: selectedCities || [],
        worldwideMode: Boolean(worldwideMode),
      },
    });

    res.json({
      selectedCategories: userFilters.selectedCategories || [],
      selectedCountries: userFilters.selectedCountries || [],
      selectedCities: userFilters.selectedCities || [],
      worldwideMode: userFilters.worldwideMode,
    });
  } catch (error) {
    console.error('Save filters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as filtersRouter };

