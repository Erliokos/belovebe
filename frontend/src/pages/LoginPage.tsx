import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WebApp from '../utils/telegram';
import styled from 'styled-components';
import { authAPI, setToken } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import i18n from '../i18n/config';
import LoginImage from '../assets/logo.svg?react'
import { useTranslation } from 'react-i18next';

export const Icon = styled.svg`
  height: 90px;
  width: 90px;

  animation: pulse 4s ease-in-out infinite;

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1) rotate(0deg);
    }
    50% {
      transform: scale(0.5) rotate(270deg);
    }
    100% {
      transform: scale(1) rotate(360deg);
    }
  }
`


const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 100vh;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
`;

const Link = styled.a`
  text-decoration: none;
`

const LoadingText = styled.p`
  color: var(--tg-theme-hint-color, #999999);
`;

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      // Инициализируем Telegram Web App
      WebApp.ready();
      WebApp.expand();

      // Получаем initData
      const initData = WebApp.initData;
      
      if (!initData) {
        throw new Error('No initData available');
      }

      // Отправляем на бэкенд для аутентификации
      const response = await authAPI.login(initData);
      return response;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data.user)
      setToken(data.token)
      setLoading(false)

      // Устанавливаем язык пользователя
      if (data.user.language) {
        i18n.changeLanguage(data.user.language);
      }

      const taskId = getStartTaskId()

      if (taskId) {
        navigate(`/task/${taskId}`, { replace: true })
      } else {
        navigate('/feed', { replace: true })
      }
    }
  }, [data, navigate, setUser, setLoading])

  useEffect(() => {
    if (error) {
      setLoading(false);
      console.error('Auth error:', error);
    }
  }, [error, setLoading]);

  if (isLoading) {
    return (
      <Container>
        <Icon as={LoginImage} />
        <Title>{t('login.welcome')}</Title>
        <LoadingText>{t('login.authentication')}...</LoadingText>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Icon as={LoginImage} />
        <Link href="https://t.me/belovebeBot/open">Открыть приложение в Telegram</Link>
      </Container>
    )
  }

  return null
}

function getStartTaskId() {
  const WebApp = (window as any).Telegram?.WebApp

  let startParam =
    WebApp?.initDataUnsafe?.start_param ??
    new URLSearchParams(window.location.search).get('tgWebAppStartParam')

  if (startParam?.startsWith('task_')) {
    return startParam.replace('task_', '')
  }

  return null
}
