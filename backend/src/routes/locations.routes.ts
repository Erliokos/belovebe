import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// Список популярных стран (можно расширить)
const COUNTRIES = [
  { code: 'RU', name: 'Россия', nameEn: 'Russia' },
  { code: 'UA', name: 'Украина', nameEn: 'Ukraine' },
  { code: 'BY', name: 'Беларусь', nameEn: 'Belarus' },
  { code: 'KZ', name: 'Казахстан', nameEn: 'Kazakhstan' },
  { code: 'US', name: 'США', nameEn: 'United States' },
  { code: 'GB', name: 'Великобритания', nameEn: 'United Kingdom' },
  { code: 'DE', name: 'Германия', nameEn: 'Germany' },
  { code: 'FR', name: 'Франция', nameEn: 'France' },
  { code: 'IT', name: 'Италия', nameEn: 'Italy' },
  { code: 'ES', name: 'Испания', nameEn: 'Spain' },
  { code: 'PL', name: 'Польша', nameEn: 'Poland' },
  { code: 'TR', name: 'Турция', nameEn: 'Turkey' },
  { code: 'CN', name: 'Китай', nameEn: 'China' },
  { code: 'JP', name: 'Япония', nameEn: 'Japan' },
  { code: 'IN', name: 'Индия', nameEn: 'India' },
];

// Список популярных городов по странам
const CITIES: Record<string, Array<{ name: string; nameEn: string; lat: number; lng: number }>> = {
  RU: [
    { name: 'Москва', nameEn: 'Moscow', lat: 55.7558, lng: 37.6173 },
    { name: 'Санкт-Петербург', nameEn: 'Saint Petersburg', lat: 59.9343, lng: 30.3351 },
    { name: 'Новосибирск', nameEn: 'Novosibirsk', lat: 55.0084, lng: 82.9357 },
    { name: 'Екатеринбург', nameEn: 'Yekaterinburg', lat: 56.8431, lng: 60.6454 },
    { name: 'Казань', nameEn: 'Kazan', lat: 55.8304, lng: 49.0661 },
    { name: 'Нижний Новгород', nameEn: 'Nizhny Novgorod', lat: 56.2965, lng: 43.9361 },
    { name: 'Челябинск', nameEn: 'Chelyabinsk', lat: 55.1644, lng: 61.4368 },
    { name: 'Самара', nameEn: 'Samara', lat: 53.2001, lng: 50.15 },
    { name: 'Омск', nameEn: 'Omsk', lat: 54.9885, lng: 73.3242 },
    { name: 'Ростов-на-Дону', nameEn: 'Rostov-on-Don', lat: 47.2357, lng: 39.7015 },
  ],
  UA: [
    { name: 'Киев', nameEn: 'Kyiv', lat: 50.4501, lng: 30.5234 },
    { name: 'Харьков', nameEn: 'Kharkiv', lat: 49.9935, lng: 36.2304 },
    { name: 'Одесса', nameEn: 'Odessa', lat: 46.4825, lng: 30.7233 },
    { name: 'Днепр', nameEn: 'Dnipro', lat: 48.4647, lng: 35.0462 },
    { name: 'Львов', nameEn: 'Lviv', lat: 49.8397, lng: 24.0297 },
  ],
  BY: [
    { name: 'Минск', nameEn: 'Minsk', lat: 53.9045, lng: 27.5615 },
    { name: 'Гомель', nameEn: 'Gomel', lat: 52.4345, lng: 30.9754 },
    { name: 'Могилёв', nameEn: 'Mogilev', lat: 53.9006, lng: 30.3314 },
  ],
  KZ: [
    { name: 'Алматы', nameEn: 'Almaty', lat: 43.2220, lng: 76.8512 },
    { name: 'Нур-Султан', nameEn: 'Nur-Sultan', lat: 51.1694, lng: 71.4491 },
    { name: 'Шымкент', nameEn: 'Shymkent', lat: 42.3417, lng: 69.5901 },
  ],
  US: [
    { name: 'Нью-Йорк', nameEn: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Лос-Анджелес', nameEn: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Чикаго', nameEn: 'Chicago', lat: 41.8781, lng: -87.6298 },
  ],
  GB: [
    { name: 'Лондон', nameEn: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Манчестер', nameEn: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { name: 'Бирмингем', nameEn: 'Birmingham', lat: 52.4862, lng: -1.8904 },
  ],
  DE: [
    { name: 'Берлин', nameEn: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Мюнхен', nameEn: 'Munich', lat: 48.1351, lng: 11.5820 },
    { name: 'Гамбург', nameEn: 'Hamburg', lat: 53.5511, lng: 9.9937 },
  ],
};

/**
 * GET /api/locations/countries
 * Получить список стран
 */
router.get('/countries', async (req: AuthRequest, res: Response) => {
  try {
    res.json(COUNTRIES);
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/cities
 * Получить список городов по стране
 */
router.get('/cities', async (req: AuthRequest, res: Response) => {
  try {
    const { countryCode } = req.query;

    if (!countryCode || typeof countryCode !== 'string') {
      return res.status(400).json({ error: 'countryCode is required' });
    }

    const cities = CITIES[countryCode] || [];
    res.json(cities);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as locationsRouter };

