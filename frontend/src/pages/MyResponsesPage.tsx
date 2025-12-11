import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { responsesAPI } from '../api/client'
import { Response, ResponseStatus } from '../types'
import Chat from '../components/Chat'
import { useTranslation } from 'react-i18next'
import { SwipeCard } from '../components/SwiperCard'
import { ActionButtonShare } from '../components/ActionButtonShare'
import { SwipeManagerProvider } from '../stores/SwipeManagerContext'

const Container = styled.div`
  padding: 16px;
  max-width: 100%;
`

const Header = styled.div`
  padding-left: 8px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
`

const ResponsesList = styled.div`
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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`

const TaskTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  margin-right: 8px;
`

const StatusBadge = styled.span<{ status: ResponseStatus }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => {
    switch (props.status) {
      case ResponseStatus.PENDING:
        return '#ffa500'
      case ResponseStatus.ACCEPTED:
        return '#4caf50'
      case ResponseStatus.REJECTED:
        return '#f44336'
      default:
        return '#999999'
    }
  }};
  color: #ffffff;
`

const CoverLetter = styled.p`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #666666);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
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

const UnreadBadge = styled.span`
  background-color: #ff4444;
  color: #ffffff;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`

const Budget = styled.span`
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
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

const ChatButton = styled.button`

  padding: 8px;
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  width: 90px;

  &:active {
    opacity: 0.8;
  }
`

const getStatusLabel = (status: ResponseStatus): string => {
  switch (status) {
    case ResponseStatus.PENDING:
      return 'pending'
    case ResponseStatus.ACCEPTED:
      return 'accepted'
    case ResponseStatus.REJECTED:
      return 'rejected'
    default:
      return status
  }
}

export default function MyResponsesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeChatResponse, setActiveChatResponse] = useState<Response | null>(
    null
  )

  const { data: responses, isLoading } = useQuery({
    queryKey: ['my-responses'],
    queryFn: responsesAPI.getMyResponses,
    refetchInterval: 5000
  })

  const handleResponseClick = (taskId: number) => {
    navigate(`/task/${taskId}`)
  }

  const handleOpenChat = (e: React.MouseEvent, response: Response) => {
    e.stopPropagation()
    setActiveChatResponse(response)
    // Обновляем список откликов при открытии чата, чтобы обновить счетчик непрочитанных
    queryClient.invalidateQueries({ queryKey: ['my-responses'] })
  }

  if (isLoading) {
    return (
      <Container>
        <LoadingText>{t('response.uploadingResponses')}...</LoadingText>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>{t('response.mayResponses')}</Title>
      </Header>
      <SwipeManagerProvider>
        <ResponsesList>
          {responses?.map((response: Response) => (
            <SwipeCard
              id={String(response.id)}
              leftAction={
                <ActionButtonShare
                  id={response.taskId}
                  title={response.task?.title}
                />
              }
            >
              <CardContainer
                key={response.id}
                onClick={() =>
                  response.task && handleResponseClick(response.task.id)
                }
              >
                <CardHeader>
                  <TaskTitle>
                    {response.task?.title || t('response.task')}
                    {!!response.unreadMessagesCount &&
                      response.unreadMessagesCount > 0 && (
                        <UnreadBadge>
                          {response.unreadMessagesCount}
                        </UnreadBadge>
                      )}
                  </TaskTitle>
                  <StatusBadge status={response.status}>
                    {t(`response.${getStatusLabel(response.status)}`)}
                  </StatusBadge>
                </CardHeader>
                {response.coverLetter && (
                  <CoverLetter>{response.coverLetter}</CoverLetter>
                )}
                <CardFooter>
                  {response.proposedSum && (
                    <Budget>{response.proposedSum.toLocaleString()} ₽</Budget>
                  )}
                  <EasySpan>
                    {new Date(response.createdAt).toLocaleDateString('ru-RU')}
                  </EasySpan>
                  {response.hasMessages && (
                    <ChatButton onClick={e => handleOpenChat(e, response)}>
                      {t('response.openChat')}
                    </ChatButton>
                  )}
                </CardFooter>
              </CardContainer>
            </SwipeCard>
          ))}
          {responses?.length === 0 && (
            <EmptyText>{t('response.notResponses')}</EmptyText>
          )}
        </ResponsesList>
      </SwipeManagerProvider>
      {activeChatResponse && (
        <Chat
          response={activeChatResponse}
          taskTitle={activeChatResponse.task?.title}
          onClose={() => setActiveChatResponse(null)}
        />
      )}
    </Container>
  )
}
