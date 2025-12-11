import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Все роуты требуют аутентификации
router.use(authMiddleware);

/**
 * @swagger
 * /api/responses:
 *   post:
 *     summary: Создать отклик на задание
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - coverLetter
 *             properties:
 *               taskId:
 *                 type: integer
 *               proposedSum:
 *                 type: number
 *               coverLetter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Отклик создан
 *       400:
 *         description: Неверные данные
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, proposedSum, coverLetter } = req.body;
    const executorId = req.user!.userId;

    if (!taskId || !coverLetter) {
      return res.status(400).json({ error: 'taskId and coverLetter are required' });
    }

    // Проверяем, что задание существует и не является заданием самого пользователя
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId, 10) },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.authorId === executorId) {
      return res.status(400).json({ error: 'Cannot respond to your own task' });
    }

    // Проверяем, не откликался ли уже пользователь
    const existingResponse = await prisma.response.findFirst({
      where: {
        taskId: parseInt(taskId, 10),
        executorId,
      },
    });

    if (existingResponse) {
      return res.status(400).json({ error: 'You have already responded to this task' });
    }

    const response = await prisma.response.create({
      data: {
        taskId: parseInt(taskId, 10),
        executorId,
        proposedSum: proposedSum ? parseFloat(proposedSum) : null,
        coverLetter,
        status: 'PENDING',
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Create response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/responses/my:
 *   get:
 *     summary: Получить отклики текущего пользователя
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список откликов пользователя
 */
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const executorId = req.user!.userId;

    const responses = await prisma.response.findMany({
      where: { executorId },
      include: {
        task: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Получаем информацию о непрочитанных сообщениях для каждого отклика
    const responseIds = responses.map(r => r.id);
    const conversations = await prisma.conversation.findMany({
      where: {
        executorId: executorId,
        taskId: { in: responses.map(r => r.taskId) },
      },
      include: {
        messages: {
          where: {
            senderId: { not: executorId },
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

    // Создаем мапу taskId -> количество непрочитанных сообщений и наличие сообщений
    const unreadCounts = new Map<number, number>();
    const hasMessagesMap = new Map<number, boolean>();
    conversations.forEach(conv => {
      unreadCounts.set(conv.taskId, conv.messages.length);
      hasMessagesMap.set(conv.taskId, conv._count.messages > 0);
    });

    // Добавляем информацию о непрочитанных сообщениях к каждому отклику
    const responsesWithUnread = responses.map(response => ({
      ...response,
      unreadMessagesCount: unreadCounts.get(response.taskId) || 0,
      hasMessages: hasMessagesMap.get(response.taskId) || false,
    }));

    res.json(responsesWithUnread);
  } catch (error) {
    console.error('Get my responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/responses/{id}:
 *   patch:
 *     summary: Изменить статус отклика (принять/отклонить)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED]
 *     responses:
 *       200:
 *         description: Статус обновлен
 *       403:
 *         description: Нет доступа
 *       404:
 *         description: Отклик не найден
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const responseId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be ACCEPTED or REJECTED' });
    }

    // Получаем отклик с информацией о задании
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        task: true,
      },
    });

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Проверяем, что пользователь является автором задания
    if (response.task.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Обновляем статус отклика
    const updatedResponse = await prisma.response.update({
      where: { id: responseId },
      data: { status },
      include: {
        executor: {
          include: {
            profile: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Если отклик принят, меняем статус задания на IN_PROGRESS
    if (status === 'ACCEPTED') {
      await prisma.task.update({
        where: { id: response.taskId },
        data: { status: 'IN_PROGRESS' },
      });

      // Отклоняем все остальные отклики на это задание
      await prisma.response.updateMany({
        where: {
          taskId: response.taskId,
          id: { not: responseId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      });
    }

    res.json(updatedResponse);
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as responsesRouter };

