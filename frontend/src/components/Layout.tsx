import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useAppStore } from '../stores/appStore'
import TaskIcon from '../assets/tasks.svg?react'
import ResponesIcon from '../assets/respones.svg?react'
import MyTasksIcon from '../assets/mytask.svg?react'
import ProfileIcon from '../assets/profile.svg?react'
import { useQuery } from '@tanstack/react-query'
import { notificationsAPI } from '../api/client'
import { useAuthStore } from '../stores/authStore'
import { useNotificationState } from '../stores/notificationStore'
import { Badge } from '../globalStyle'

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 60px;
`

const Content = styled.main`
  flex: 1;
  width: 100%;
`

const Icon = styled.svg<{ $isActive: boolean }>`
  width: 30px;
  height: 30px;
  cursor: pointer;
  fill: ${({ $isActive }) =>
    $isActive
      ? `var(--tg-theme-button-color, #3390ec)`
      : `var(--tg-theme-hint-color, #999999)`};
`

const BottomNavigation = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-top: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding-bottom: 20px;
`

const NavButton = styled.button<{ $active?: boolean }>`
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${props =>
    props.$active
      ? 'var(--tg-theme-button-color, #3390ec)'
      : 'var(--tg-theme-hint-color, #999999)'};
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;

  &:active {
    opacity: 0.7;
  }
`


interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeTab, setActiveTab } = useAppStore()
  const { setUnreadMessage } = useNotificationState()
  const { user } = useAuthStore()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getUnreadMessage,
    refetchInterval: 5000,
    enabled: !!user
  })

  useEffect(() => {
    setUnreadMessage(notifications?.myUnreadMessageCount ?? [])
  }, [notifications])

  useEffect(() => {
    const path = location.pathname
    if (path === '/' || path.startsWith('/feed') || path.startsWith('/task/')) {
      setActiveTab('feed')
    } else if (path.startsWith('/responses')) {
      setActiveTab('responses')
    } else if (path.startsWith('/my-tasks')) {
      setActiveTab('my-tasks')
    } else if (path.startsWith('/profile')) {
      setActiveTab('profile')
    }
  }, [location.pathname, setActiveTab])

  const handleNavClick = (
    tab: 'feed' | 'responses' | 'my-tasks' | 'profile'
  ) => {
    setActiveTab(tab)
    navigate(`/${tab === 'feed' ? 'feed' : tab}`)
  }

  return (
    <LayoutContainer>
      <Content>{children}</Content>
      <BottomNavigation>
        <NavButton
          $active={activeTab === 'feed'}
          onClick={() => handleNavClick('feed')}
        >
          <Icon as={TaskIcon} $isActive={activeTab === 'feed'} />
        </NavButton>
        <NavButton
          $active={activeTab === 'responses'}
          onClick={() => handleNavClick('responses')}
        >
          <Icon as={ResponesIcon} $isActive={activeTab === 'responses'} />
          {!!notifications?.unreadMessageCount &&
            notifications?.unreadMessageCount > 0 && (
              <Badge>{notifications?.unreadMessageCount}</Badge>
            )}
        </NavButton>
        <NavButton
          $active={activeTab === 'my-tasks'}
          onClick={() => handleNavClick('my-tasks')}
        >
          <Icon as={MyTasksIcon} $isActive={activeTab === 'my-tasks'} />
          {!!notifications &&
            (notifications?.myUnreadMessageCount.length > 0 ||
              notifications.unreadResponses.length > 0) && (
              <Badge>
                {notifications?.myUnreadMessageCount.length +
                  notifications.unreadResponses.length}
              </Badge>
            )}
        </NavButton>
        <NavButton
          $active={activeTab === 'profile'}
          onClick={() => handleNavClick('profile')}
        >
          <Icon as={ProfileIcon} $isActive={activeTab === 'profile'} />
        </NavButton>
      </BottomNavigation>
    </LayoutContainer>
  )
}
