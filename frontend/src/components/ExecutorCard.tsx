import styled from 'styled-components';
import { Response, ResponseStatus } from '../types';

const Card = styled.div`
  background-color: var(--tg-theme-secondary-bg-color, #ffffff);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ExecutorInfo = styled.div`
  flex: 1;
`;

const ExecutorName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ExecutorStats = styled.div`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
`;

const StatusBadge = styled.span<{ status: ResponseStatus }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${(props) => {
    switch (props.status) {
      case ResponseStatus.PENDING:
        return '#ffa500';
      case ResponseStatus.ACCEPTED:
        return '#4caf50';
      case ResponseStatus.REJECTED:
        return '#f44336';
      default:
        return '#999999';
    }
  }};
  color: #ffffff;
`;

const CoverLetter = styled.p`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: var(--tg-theme-text-color, #000000);
`;

const ProposedSum = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--tg-theme-button-color, #3390ec);
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background-color: ${(props) =>
    props.variant === 'primary'
      ? 'var(--tg-theme-button-color, #3390ec)'
      : 'var(--tg-theme-bg-color, #f0f0f0)'};
  color: ${(props) =>
    props.variant === 'primary'
      ? 'var(--tg-theme-button-text-color, #ffffff)'
      : 'var(--tg-theme-text-color, #000000)'};

  &:active {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UnreadBadge = styled.span`
  background-color: #ff4444;
  color: #ffffff;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`;

interface ExecutorCardProps {
  response: Response;
  onAccept: () => void;
  onMessage: () => void;
}

export default function ExecutorCard({ response, onAccept, onMessage }: ExecutorCardProps) {
  const { executor, proposedSum, coverLetter, status } = response;
  const profile = executor.profile;

  const getStatusLabel = (status: ResponseStatus): string => {
    switch (status) {
      case ResponseStatus.PENDING:
        return 'Ожидает';
      case ResponseStatus.ACCEPTED:
        return 'Принят';
      case ResponseStatus.REJECTED:
        return 'Отклонен';
      default:
        return status;
    }
  };

  return (
    <Card>
      <Header>
        <ExecutorInfo>
          <ExecutorName>
            {executor.firstName || executor.username || 'Пользователь'}
            {!!response.unreadMessagesCount && response.unreadMessagesCount > 0 && (
              <UnreadBadge>{response.unreadMessagesCount}</UnreadBadge>
            )}
          </ExecutorName>
          <ExecutorStats>
            Рейтинг: {profile?.rating.toFixed(1) || '0.0'} | Выполнено:{' '}
            {profile?.completedTasks || 0} | Нагрузка: {profile?.currentTasks}
          </ExecutorStats>
        </ExecutorInfo>
        <StatusBadge status={status}>{getStatusLabel(status)}</StatusBadge>
      </Header>
      {proposedSum && (
        <ProposedSum>{proposedSum.toLocaleString()} ₽</ProposedSum>
      )}
      {coverLetter && <CoverLetter>{coverLetter}</CoverLetter>}
      {status === ResponseStatus.PENDING && (
        <Actions>
          {response.hasMessages ? (
            <Button variant="secondary" onClick={onMessage}>
              Открыть чат
            </Button>
          ) : (
            <Button variant="secondary" onClick={onMessage}>
              Написать
            </Button>
          )}
          <Button variant="primary" onClick={onAccept}>
            Выбрать исполнителем
          </Button>
        </Actions>
      )}
      {status === ResponseStatus.ACCEPTED && (
        <Actions>
          {response.hasMessages ? (
            <Button variant="secondary" onClick={onMessage}>
              Открыть чат
            </Button>
          ) : (
            <Button variant="secondary" onClick={onMessage}>
              Написать
            </Button>
          )}
        </Actions>
      )}
    </Card>
  )
}

