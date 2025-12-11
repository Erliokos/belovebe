import { Router, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const NOMINATIM_HEADERS = {
  'User-Agent': 'belovebeApp/1.0 (https://belovebe.ru)',
  'Accept-Language': 'ru',
};

type AddressPayload = {
  country?: string;
  city?: string;
  street?: string;
  house?: string;
};

const parseFloatValue = (value: any): number | null => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseIntValue = (value: any): number | null => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Math.trunc(value);
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

async function geocodeAddress({ country, city, street, house }: AddressPayload) {
  const queryParts = [
    street && house ? `${street} ${house}` : street,
    house && !street ? house : undefined,
    city,
    country,
  ].filter(Boolean) as string[];

  if (queryParts.length === 0) return null;

  const searchQuery = encodeURIComponent(queryParts.join(', '));
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${searchQuery}`;

  try {
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      console.error('Geocode request failed:', response.status, response.statusText);
      return null;
    }
    const payload = await response.json();
    if (Array.isArray(payload) && payload.length > 0) {
      const latitude = parseFloat(payload[0].lat);
      const longitude = parseFloat(payload[0].lon);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch (error) {
    console.error('Geocode error:', error);
  }

  return null;
}

// Все роуты требуют аутентификации
router.use(authMiddleware);

/**
 * GET /api/tasks
 * Получить список заданий (лента) с фильтром по категориям и пагинацией
 */
router.get('/', async (req: AuthRequest, res: Response) => {  
  try {
    const { categories, countries, cities, worldwide, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const categoryIds = categories
      ? (categories as string).split(',').map((id) => parseInt(id, 10))
      : undefined;

    const countryList = countries
      ? (countries as string).split(',')
      : undefined;

    const cityList = cities
      ? (cities as string).split(',')
      : undefined;

    const where: any = { status: 'PUBLISHED' };
    if (categoryIds && categoryIds.length > 0) where.categoryId = { in: categoryIds };
    
    // Фильтрация по странам и городам (если не включен режим "по всему миру")
    if (worldwide !== 'true') {
      if (countryList && countryList.length > 0) {
        where.country = { in: countryList };
      }
      if (cityList && cityList.length > 0) {
        where.city = { in: cityList };
      }
    }

    const userId = req.user!.userId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          category: true,
          author: { select: { id: true, firstName: true, lastName: true, username: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    // Получаем все отклики пользователя на эти задания одним запросом
    const taskIds = tasks.map(t => t.id);
    const userResponses = await prisma.response.findMany({
      where: {
        taskId: { in: taskIds },
        executorId: userId,
      },
      select: {
        taskId: true,
      },
    });

    const userResponseTaskIds = new Set(userResponses.map(r => r.taskId));

    // Добавляем информацию об отклике пользователя к каждому заданию
    const tasksWithResponseInfo = tasks.map(task => ({
      ...task,
      hasUserResponse: userResponseTaskIds.has(task.id),
    }));

    res.json({
      tasks: tasksWithResponseInfo,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/my-tasks
 * Получить задания текущего пользователя
 */
router.get('/my-tasks', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const tasks = await prisma.task.findMany({
      where: { authorId: userId },
      include: {
        category: true,
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/:id
 * Получить детали задания по ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const userId = req.user!.userId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true, username: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Проверяем, откликнулся ли текущий пользователь на это задание
    const userResponse = await prisma.response.findFirst({
      where: {
        taskId: taskId,
        executorId: userId,
      },
    });

    // Увеличиваем счетчик просмотров
    await prisma.task.update({
      where: { id: taskId },
      data: { viewsCount: { increment: 1 } },
    });

    res.json({
      ...task,
      hasUserResponse: !!userResponse,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks
 * Создать новое задание
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      categoryId,
      budget,
      startDate,
      endDate,
      country,
      city,
      street,
      house,
      latitude,
      longitude,
    } = req.body;
    const userId = req.user!.userId;

    const normalizedCategoryId = parseIntValue(categoryId);
    if (!title || !description || !normalizedCategoryId) {
      return res.status(400).json({ error: 'Title, description and categoryId are required' });
    }

    let latitudeValue = parseFloatValue(latitude);
    let longitudeValue = parseFloatValue(longitude);

    const shouldGeocode = Boolean((street || house) && (country || city));
    if (shouldGeocode) {
      const coords = await geocodeAddress({ country, city, street, house });
      if (coords) {
        latitudeValue = coords.latitude;
        longitudeValue = coords.longitude;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        categoryId: normalizedCategoryId,
        authorId: userId,
        budget: parseFloatValue(budget),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        country: country || null,
        city: city || null,
        street: street || null,
        house: house || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
        status: TaskStatus.PUBLISHED,
      },
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tasks/:id
 * Обновить задание автора
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (existingTask.authorId !== req.user!.userId)
      return res.status(403).json({ error: 'Access denied' });

    const {
      title,
      description,
      categoryId,
      budget,
      startDate,
      endDate,
      country,
      city,
      street,
      house,
      latitude,
      longitude,
    } = req.body;

    const normalizedCategoryId = parseIntValue(categoryId);
    if (!title || !description || !normalizedCategoryId) {
      return res.status(400).json({ error: 'Title, description and categoryId are required' });
    }

    const updateData: any = {
      title,
      description,
      categoryId: normalizedCategoryId,
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'budget')) {
      updateData.budget = parseFloatValue(budget);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'startDate')) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'endDate')) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'country')) {
      updateData.country = country || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'city')) {
      updateData.city = city || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'street')) {
      updateData.street = street || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'house')) {
      updateData.house = house || null;
    }

    let latitudeValue = parseFloatValue(latitude);
    let longitudeValue = parseFloatValue(longitude);
    const shouldGeocode = Boolean(
      (street || house) &&
      (country || city) &&
      latitudeValue === null &&
      longitudeValue === null
    );
    if (shouldGeocode) {
      const coords = await geocodeAddress({ country, city, street, house });
      if (coords) {
        latitudeValue = coords.latitude;
        longitudeValue = coords.longitude;
      }
    }

    if (latitudeValue !== null) {
      updateData.latitude = latitudeValue;
    }
    if (longitudeValue !== null) {
      updateData.longitude = longitudeValue;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true, username: true } },
        _count: { select: { responses: true } },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Обновить статус задания
 */
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const { status } = req.body;
    const nextStatus = status as TaskStatus;
    if (!nextStatus || !Object.values(TaskStatus).includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (existingTask.authorId !== req.user!.userId)
      return res.status(403).json({ error: 'Access denied' });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus },
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true, username: true } },
        _count: { select: { responses: true } },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Удалить задание автора
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (existingTask.authorId !== req.user!.userId)
      return res.status(403).json({ error: 'Access denied' });

    await prisma.task.delete({ where: { id: taskId } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



/**
 * GET /api/tasks/:id/responses
 * Получить отклики на задание (только для автора)
 */
router.get('/:id/responses', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });

    const userId = req.user!.userId;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.authorId !== userId) return res.status(403).json({ error: 'Access denied' });

    const responses = await prisma.response.findMany({
      where: { taskId },
      include: { executor: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Получаем информацию о непрочитанных сообщениях для каждого отклика
    const executorIds = responses.map(r => r.executorId);
    const conversations = await prisma.conversation.findMany({
      where: {
        taskId: taskId,
        executorId: { in: executorIds },
      },
      include: {
        messages: {
          where: {
            senderId: { not: userId },
            readAt: null,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Создаем мапу executorId -> количество непрочитанных сообщений и наличие сообщений
    const unreadCounts = new Map<number, number>();
    const hasMessagesMap = new Map<number, boolean>();
    conversations.forEach(conv => {
      unreadCounts.set(conv.executorId, conv.messages.length);
      hasMessagesMap.set(conv.executorId, conv._count.messages > 0);
    });

    // Обновляем счетчик просмотренных откликов
    const newResponsesCount = responses.length;
    if (newResponsesCount > task.viewedResponsesCount) {
      await prisma.task.update({
        where: { id: taskId },
        data: { viewedResponsesCount: newResponsesCount },
      });
    }

    // Добавляем информацию о непрочитанных сообщениях к каждому отклику
    const responsesWithUnread = responses.map(response => ({
      ...response,
      unreadMessagesCount: unreadCounts.get(response.executorId) || 0,
      hasMessages: hasMessagesMap.get(response.executorId) || false,
    }));

    res.json(responsesWithUnread);
  } catch (error) {
    console.error('Get task responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as tasksRouter };
