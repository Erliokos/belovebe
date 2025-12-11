import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import WebApp from '../utils/telegram' // Импортируем вашу утилиту

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, setUser, initialize } = useAuthStore()

  useEffect(() => {
    // Проверяем, есть ли данные Telegram пользователя
    const checkTelegramAuth = () => {
      try {
        const userData = WebApp.initDataUnsafe?.user

        if (userData) {
          // Автоматически "логиним" пользователя если есть данные Telegram
          setUser({
            id: userData.id.toString(),
            username: userData.username || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            tgId: userData.tgId,
          })
        } else {
          // Если данных Telegram нет, завершаем инициализацию
          initialize()
        }
      } catch (error) {
        console.error('Telegram auth check failed:', error)
        initialize()
      }
    }

    if (isLoading) {
      checkTelegramAuth()

      // Фолбэк таймаут на случай если проверка зависнет
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Auth check timeout, forcing initialization')
          initialize()
        }
      }, 5000)

      return () => clearTimeout(timeoutId)
    }
  }, [isLoading, setUser, initialize])

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
