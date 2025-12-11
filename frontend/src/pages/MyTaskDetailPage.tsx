import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { tasksAPI, responsesAPI } from '../api/client';
import ExecutorCard from '../components/ExecutorCard';
import Chat from '../components/Chat';
import { Response as TaskResponse } from '../types';

const Container = styled.div`
  padding: 16px;
  max-width: 100%;
`;

const BackButton = styled.button`
  margin-bottom: 16px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--tg-theme-button-color, #3390ec);
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const ResponsesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`;

export default function MyTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeChatResponse, setActiveChatResponse] = useState<TaskResponse | null>(null);

  const { data: task } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksAPI.getTask(Number(id)),
  });

  const { data: responses, isLoading } = useQuery({
    queryKey: ['task-responses', id],
    queryFn: () => tasksAPI.getTaskResponses(Number(id)),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: (responseId: number) =>
      responsesAPI.updateResponseStatus(responseId, 'ACCEPTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-responses', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });

  if (isLoading) {
    return (
      <Container>
        <LoadingText>Загрузка откликов...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
      <Title>{task?.title || 'Задание'}</Title>
      <ResponsesList>
        {responses?.length === 0 ? (
          <EmptyText>Пока нет откликов</EmptyText>
        ) : (
          responses?.map((response) => (
            <ExecutorCard
              key={response.id}
              response={response}
              onAccept={() => acceptMutation.mutate(response.id)}
              onMessage={() => setActiveChatResponse(response)}
            />
          ))
        )}
      </ResponsesList>
      {activeChatResponse && (
        <Chat
          response={activeChatResponse}
          taskTitle={task?.title}
          onClose={() => setActiveChatResponse(null)}
        />
      )}
    </Container>
  );
}

