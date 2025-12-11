import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../api/client';
import { Response as TaskResponse } from '../types';
import { useAuthStore } from '../stores/authStore';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 2000;
`;

const ChatContainer = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--tg-theme-secondary-bg-color, #ffffff);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  display: flex;
  flex-direction: column;
  min-height: 50vh;
  max-height: 90%;
`

const ChatHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.span`
  font-size: 16px;
  font-weight: 600;
`;

const Subtitle = styled.span`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--tg-theme-text-color, #000000);
`;

const MessagesWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div<{ isMine: boolean }>`
  max-width: 80%;
  align-self: ${(props) => (props.isMine ? 'flex-end' : 'flex-start')};
  background: ${(props) =>
    props.isMine ? 'var(--tg-theme-button-color, #3390ec)' : 'var(--tg-theme-bg-color, #f0f0f0)'};
  color: ${(props) => (props.isMine ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-text-color, #000000)')};
  padding: 10px 12px;
  border-radius: 12px;
  border-bottom-right-radius: ${(props) => (props.isMine ? '0' : '12px')};
  border-bottom-left-radius: ${(props) => (props.isMine ? '12px' : '0')};
  font-size: 14px;
  line-height: 1.4;
`;

const MessageMeta = styled.span<{ isMine: boolean }>`
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: ${(props) =>
    props.isMine ? 'rgba(255, 255, 255, 0.8)' : 'var(--tg-theme-hint-color, #666666)'};
`;

const InputWrapper = styled.form`
  padding: 12px 16px 20px;
  display: flex;
  gap: 8px;
  background: var(--tg-theme-bg-color, #ffffff);
  border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0);
`;

const MessageInput = styled.textarea`
  flex: 1;
  resize: none;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 12px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  background: var(--tg-theme-secondary-bg-color, #f7f7f7);
  color: var(--tg-theme-text-color, #000000);
  min-height: 46px;
  max-height: 120px;
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: ${(props) =>
    props.disabled ? 'var(--tg-theme-hint-color, #cccccc)' : 'var(--tg-theme-button-color, #3390ec)'};
  color: var(--tg-theme-button-text-color, #ffffff);
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--tg-theme-hint-color, #999999);
  font-size: 14px;
  margin-top: 40px;
`;

interface ChatProps {
  response: TaskResponse;
  onClose: () => void;
  taskTitle?: string;
}

export default function Chat({ response, onClose, taskTitle: explicitTaskTitle }: ChatProps) {
  const [message, setMessage] = useState('');
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversation,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['chat', response.id],
    queryFn: () => chatAPI.openConversation(response.id),
    enabled: Boolean(response?.id),
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!conversation) {
        throw new Error('Conversation not ready');
      }
      return chatAPI.sendMessage(conversation.id, content);
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat', response.id] });
      queryClient.invalidateQueries({ queryKey: ['my-responses'] });
    },
  });

  // Определяем имя собеседника: если текущий пользователь - исполнитель, показываем автора, и наоборот
  const isExecutor = currentUser?.id === response.executorId;
  const otherUser = isExecutor 
    ? (conversation?.author || { firstName: undefined, username: undefined })
    : (conversation?.executor || response.executor);
  const otherUserName = otherUser.firstName || otherUser.username || (isExecutor ? 'Автор' : 'Исполнитель');
  const taskTitle = explicitTaskTitle || response.task?.title || 'Задание';

  const messages = useMemo(() => conversation?.messages ?? [], [conversation?.messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Помечаем сообщения как прочитанные при открытии чата
  useEffect(() => {
    if (conversation) {
      chatAPI.markAsRead(conversation.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-responses'] });
        queryClient.invalidateQueries({ queryKey: ['task-responses'] });
      }).catch((error) => {
        console.error('Failed to mark messages as read:', error);
      });
    }
  }, [conversation, queryClient]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !conversation || sendMessageMutation.isPending) {
      return;
    }
    sendMessageMutation.mutate(trimmed);
  };

  return (
    <Overlay>
      <ChatContainer>
        <ChatHeader>
          <HeaderTitle>
            <Title>{otherUserName}</Title>
            <Subtitle>{taskTitle}</Subtitle>
          </HeaderTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ChatHeader>
        <MessagesWrapper>
          {isLoading && <EmptyState>Загрузка чата...</EmptyState>}
          {isError && (
            <EmptyState>
              Не удалось загрузить чат.{' '}
              <button onClick={() => refetch()} style={{ color: 'inherit', textDecoration: 'underline', border: 'none', background: 'none' }}>
                Повторить
              </button>
            </EmptyState>
          )}
          {!isLoading && !isError && messages.length === 0 && <EmptyState>Пока нет сообщений</EmptyState>}
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUser?.id;
            return (
              <MessageBubble key={msg.id} isMine={Boolean(isMine)}>
                {msg.content}
                <MessageMeta isMine={Boolean(isMine)}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </MessageMeta>
              </MessageBubble>
            );
          })}
          <div ref={messagesEndRef} />
        </MessagesWrapper>
        <InputWrapper onSubmit={handleSend}>
          <MessageInput
            placeholder="Сообщение"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <SendButton
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending || !conversation}
          >
            Отпр.
          </SendButton>
        </InputWrapper>
      </ChatContainer>
    </Overlay>
  );
}


