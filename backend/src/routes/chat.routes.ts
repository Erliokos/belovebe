import { Router, Response as ExpressResponse } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { sendTelegramNotification } from '../services/telegram.service';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const userPreviewSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
};

router.post('/conversations', async (req: AuthRequest, res: ExpressResponse) => {
  try {
    const { responseId } = req.body;
    const requesterId = req.user!.userId;

    if (!responseId) {
      return res.status(400).json({ error: 'responseId is required' });
    }

    const response = await prisma.response.findUnique({
      where: { id: Number(responseId) },
      include: { task: true },
    });

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    if (response.task.authorId !== requesterId && response.executorId !== requesterId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        taskId_executorId: {
          taskId: response.taskId,
          executorId: response.executorId,
        },
      },
      update: {},
      create: {
        taskId: response.taskId,
        authorId: response.task.authorId,
        executorId: response.executorId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: userPreviewSelect,
        },
        executor: {
          select: userPreviewSelect,
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: userPreviewSelect,
            },
          },
        },
      },
    });

    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/conversations/:conversationId/messages', async (req: AuthRequest, res: ExpressResponse) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const requesterId = req.user!.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        authorId: true,
        executorId: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.authorId !== requesterId && conversation.executorId !== requesterId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: userPreviewSelect,
        },
      },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/conversations/:conversationId/messages', async (req: AuthRequest, res: ExpressResponse) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const { content } = req.body;
    const senderId = req.user!.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        author: true,
        executor: true,
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.authorId !== senderId && conversation.executorId !== senderId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: userPreviewSelect,
        },
      },
    });

    // ---- уведомление ----
    const receiverId = senderId === conversation.authorId
      ? conversation.executorId
      : conversation.authorId;

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { tg_id: true },
    });

    if (receiver?.tg_id) {
      const text = `💬 Новое сообщение от ${message.sender.firstName || message.sender.username}:
${content.trim()}`;

      sendTelegramNotification(Number(receiver.tg_id), text);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/conversations/:conversationId/mark-read', async (req: AuthRequest, res: ExpressResponse) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const requesterId = req.user!.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        authorId: true,
        executorId: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.authorId !== requesterId && conversation.executorId !== requesterId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Помечаем все непрочитанные сообщения от другого пользователя как прочитанные
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: requesterId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as chatRouter };




