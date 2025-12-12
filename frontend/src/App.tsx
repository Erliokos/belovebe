import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import FeedPage from './pages/FeedPage'
import TaskDetailPage from './pages/TaskDetailPage'

import MyTaskDetailPage from './pages/MyTaskDetailPage'

import ProfilePage from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Layout>
                  <FeedPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaskDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>g</div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyTaskDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/responses"
            element={
              <ProtectedRoute>
                <Layout>
                  <div>g</div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
