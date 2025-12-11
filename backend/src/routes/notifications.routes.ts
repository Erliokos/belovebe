// src/routes/notifications.ts
import { PrismaClient } from '@prisma/client';
import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/unreadMessages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user!.userId)

    // 1️⃣ Сообщения, где я автор conversation
    const myUnreadMessageGroups = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: { authorId: userId }
      },
      _count: { id: true }
    })

    const myUnreadMessageCount = await Promise.all(
      myUnreadMessageGroups.map(async msg => {
        const conv = await prisma.conversation.findUnique({
          where: { id: msg.conversationId },
          select: { taskId: true }
        })
        return { taskId: conv!.taskId, count: msg._count.id }
      })
    )

    // 2️⃣ Сообщения, где я исполнитель
    const unreadMessageCount = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: {
          executorId: userId
        }
      }
    })

    const tasks = await prisma.task.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        viewedResponsesCount: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    const unreadResponses = tasks
      .filter(task => task._count.responses > task.viewedResponsesCount)
      .map(task => task.id);

    res.json({
      myUnreadMessageCount,
      unreadMessageCount,
      unreadResponses
    })
  } catch (error) {
    console.error('Failed to fetch unread notifications:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export { router as notificationsRouter }
