import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { tasksAPI } from '../api/client'
import { Task, TaskStatus } from '../types'
import { useState, MouseEvent } from 'react'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { SwipeCard } from '../components/SwiperCard'
import { SwipeManagerProvider } from '../stores/SwipeManagerContext'
import { ActionButtonShare } from '../components/ActionButtonShare'
import { useTranslation } from 'react-i18next'
import { useNotificationState } from '../stores/notificationStore'
import { NewMessage } from '../components/NewMessage'
import { Badge } from '../globalStyle'


const Container = styled.div`
  padding: 16px;
  max-width: 100%;
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
`

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
`

const CardContainer = styled.div`
  position: relative;
  background-color: var(--tg-theme-secondary-bg-color, #ffffff);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const StatusBadge = styled.span<{ status: TaskStatus }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => {
    switch (props.status) {
      case TaskStatus.PUBLISHED:
        return '#3390ec'
      case TaskStatus.IN_PROGRESS:
        return '#ffa500'
      case TaskStatus.COMPLETED:
        return '#4caf50'
      case TaskStatus.CANCELLED:
        return '#f44336'
      default:
        return '#999999'
    }
  }};
  color: #ffffff;
`

const TaskDescription = styled.p`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #666666);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
`

const ResponsesBadge = styled.span`
  position: relative;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--tg-theme-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000000);
  font-weight: 400;
`

const LoadingText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const EmptyText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const CreateButton = styled.button`
  padding: 8px 16px;
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
`

const Header = styled.div`
  padding: 0 8px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`

const ActionButton = styled.button`
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  height: 100%;
  &:active {
    opacity: 0.8;
  }
  padding: 0 4px;
`

const ActionButtonGroup = styled.div`
  display: grid;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
`

const EasySpan = styled.span`
  color: var(--tg-theme-hint-color, #666666);
  font-size: 10px;
  white-space: nowrap;
  width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
`

const LeftFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const BadgeRes = styled(Badge)`
  top: -2px;
  right: -2px;
  height: 7px;
  width: 7px;
`

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.DRAFT:
      return 'draft'
    case TaskStatus.PUBLISHED:
      return 'published'
    case TaskStatus.IN_PROGRESS:
      return 'inProgress'
    case TaskStatus.COMPLETED:
      return 'completed'
    case TaskStatus.CANCELLED:
      return 'cancelled'
    default:
      return status
  }
}

type MyTaskCardProps = {
  task: Task
  onOpenDetails: (taskId: number) => void
  onUnpublish: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  messageCount: number
}

const MyTaskCard = ({
  task,
  onOpenDetails,
  onUnpublish,
  onEdit,
  onDelete,
  messageCount
}: MyTaskCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const { t } = useTranslation()

  const closeMenus = () => setSwipeOffset(0)

  const handleCardClick = () => {
    if (swipeOffset !== 0) {
      closeMenus()
      return
    }
    onOpenDetails(task.id)
  }

  const handleAction =
    (action: (task: Task) => void) => (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      action(task)
      closeMenus()
    }

  const hasNewResponses =
    task._count &&
    task.viewedResponsesCount !== undefined &&
    task._count.responses > task.viewedResponsesCount

  return (
    <SwipeCard
      id={String(task.id)}
      leftAction={<ActionButtonShare id={task.id} title={task.title} />}
      rightAction={
        <ActionButtonGroup>
          <ActionButton onClick={handleAction(onUnpublish)}>
            {t('task.removePublication')}
          </ActionButton>

          <ActionButton onClick={handleAction(onEdit)}>
            {t('task.edit')}
          </ActionButton>
          <ActionButton onClick={handleAction(onDelete)}>
            {t('task.remove')}
          </ActionButton>
        </ActionButtonGroup>
      }
    >
      <CardContainer onClick={handleCardClick}>
        <TaskHeader>
          <CardTitle>{task.title}</CardTitle>
          <StatusBadge status={task.status}>
            {t(`label.${getStatusLabel(task.status)}`)}
          </StatusBadge>
        </TaskHeader>
        <TaskDescription>{task.description}</TaskDescription>
        <TaskFooter>
          <LeftFooter>
            <ResponsesBadge>
              <EasySpan>
                {task._count?.responses || 0} {t('taskDetail.responsesCount')}
              </EasySpan>
              {hasNewResponses && <BadgeRes></BadgeRes>}
              {/* {hasNewResponses && ` (${t('taskDetail.new')})`} */}
            </ResponsesBadge>
            {!!messageCount && <NewMessage messageCount={messageCount} />}
          </LeftFooter>

          <EasySpan>
            {new Date(task.createdAt).toLocaleDateString('ru-RU')}
          </EasySpan>
        </TaskFooter>
      </CardContainer>
    </SwipeCard>
  )
}

export default function MyTasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { unreadMessage } = useNotificationState()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: tasksAPI.getMyTasks
  })

  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)

  const unpublishMutation = useMutation({
    mutationFn: (taskId: number) =>
      tasksAPI.updateTaskStatus(taskId, TaskStatus.DRAFT),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      alert('Не удалось обновить статус задачи')
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => tasksAPI.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      alert('Не удалось удалить задачу')
    }
  })

  const handleTaskClick = (taskId: number) => {
    navigate(`/my-tasks/${taskId}`)
  }

  const handleOpenCreateTask = () => {
    setTaskToEdit(undefined)
    setTaskModalOpen(true)
  }

  const handleCloseCreateTask = () => {
    setTaskModalOpen(false)
    setTaskToEdit(undefined)
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setTaskModalOpen(true)
  }

  const handleUnpublish = async (task: Task) => {
    if (!window.confirm('Снять задачу с публикации?')) return
    try {
      await unpublishMutation.mutateAsync(task.id)
    } catch {
      // onError already handled
    }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm('Удалить задачу? Это действие нельзя отменить.')) return
    try {
      await deleteTaskMutation.mutateAsync(task.id)
    } catch {
      // onError already handled
    }
  }

  if (isLoading) {
    return (
      <Container>
        <LoadingText>{t('feed.loading')}</LoadingText>
      </Container>
    )
  }

  return (
    <Container>
      {isTaskModalOpen && (
        <CreateTaskModal onClose={handleCloseCreateTask} task={taskToEdit} />
      )}
      <Header>
        <Title>{t('task.myTasks')}</Title>
        <CreateButton onClick={handleOpenCreateTask}>
          {t('task.create')}
        </CreateButton>
      </Header>
      <SwipeManagerProvider>
        <TasksList>
          {tasks?.map((task: Task) => (
            <MyTaskCard
              messageCount={
                unreadMessage.find(item => item.taskId === task.id)?.count ?? 0
              }
              key={task.id}
              task={task}
              onOpenDetails={handleTaskClick}
              onUnpublish={handleUnpublish}
              onEdit={handleEditTask}
              onDelete={handleDelete}
            />
          ))}
          {tasks?.length === 0 && (
            <EmptyText>{t('task.haventCreated')}</EmptyText>
          )}
        </TasksList>
      </SwipeManagerProvider>
    </Container>
  )
}
