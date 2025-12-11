import styled from 'styled-components';
import { Task } from '../types';
import { useAuthStore } from '../stores/authStore'
import { SwipeCard } from './SwiperCard';
import { useTranslation } from 'react-i18next';
import { ActionButtonShare } from './ActionButtonShare';

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


const CardHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardDescription = styled.p`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #666666);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
`

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
`;

const Budget = styled.span`
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
`;

const Badge = styled.span`
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  width: 90px;

  /* Добавьте эти свойства для троеточия */
  overflow: hidden;
  text-overflow: ellipsis;

  /* Можно также добавить */
  display: block; /* или inline-block */
`

const MyTaskBadge = styled(Badge)`
  background-color: #44cc44;
`

const RespondedBadge = styled(Badge)`
  background-color: #c99b1e;
`

const InfoGrop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`

const CardFooterGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`
const CardTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
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

const ResponsesSpan = styled(EasySpan)`
  text-align: left;
`

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { t } = useTranslation()
  const currentUser = useAuthStore(state => state.user)
  const isMyTask = currentUser?.id === task.author.id
  const hasUserResponse = task.hasUserResponse || false

  return (
    <SwipeCard
      id={String(task.id)}
      leftAction={<ActionButtonShare id={task.id} title={task.title}/>}
    >
      <CardContainer onClick={onClick}>
        <CardHeader>
          <CardTitleGroup>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </CardTitleGroup>

          <InfoGrop>
            {isMyTask && <MyTaskBadge>{t(`feed.isMyTask`)}</MyTaskBadge>}
            {hasUserResponse && !isMyTask && (
              <RespondedBadge>{t(`feed.responded`)}</RespondedBadge>
            )}

            <Badge>{t(`categories.${task.category.name}`)}</Badge>
            {task.startDate && (
              <EasySpan>
                start: {new Date(task.startDate).toLocaleDateString()}
              </EasySpan>
            )}
            {task.endDate && (
              <EasySpan>
                end: {new Date(task.endDate).toLocaleDateString()}
              </EasySpan>
            )}
            {task.country && <EasySpan>{task.country}</EasySpan>}
            {task.city && <EasySpan>{task.city}</EasySpan>}
          </InfoGrop>
        </CardHeader>

        <CardFooter>
          <CardFooterGroup>
            {task.budget && <Budget>{task.budget.toLocaleString()} ₽</Budget>}
            {task._count && (
              <ResponsesSpan>{task._count.responses} откликов</ResponsesSpan>
            )}
          </CardFooterGroup>
          <EasySpan>
            {new Date(task.createdAt).toLocaleDateString('ru-RU')}
          </EasySpan>
        </CardFooter>
      </CardContainer>
    </SwipeCard>
  )
}

