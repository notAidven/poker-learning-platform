import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  GuestOnlyRoute,
  ProfileSetupRoute,
  ProtectedRoute,
} from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { SignUpPage } from './pages/SignUpPage'

const CoursePage = lazy(() =>
  import('./pages/CoursePage').then((m) => ({ default: m.CoursePage })),
)
const LessonPage = lazy(() =>
  import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })),
)
const SkillCheckPage = lazy(() =>
  import('./pages/SkillCheckPage').then((m) => ({ default: m.SkillCheckPage })),
)
const TablePage = lazy(() =>
  import('./pages/TablePage').then((m) => ({ default: m.TablePage })),
)
const CasinoLobbyPage = lazy(() =>
  import('./pages/CasinoLobbyPage').then((m) => ({ default: m.CasinoLobbyPage })),
)
const CasinoTablePage = lazy(() =>
  import('./pages/CasinoTablePage').then((m) => ({ default: m.CasinoTablePage })),
)
const GlossaryPage = lazy(() =>
  import('./pages/GlossaryPage').then((m) => ({ default: m.GlossaryPage })),
)

function RouteFallback() {
  return (
    <div className="mx-auto max-w-lg p-8 text-center text-sm text-night-700/70" aria-live="polite">
      Loading…
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignUpPage /> },
        ],
      },
      {
        element: <ProfileSetupRoute />,
        children: [{ path: 'setup-profile', element: <ProfileSetupPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'course',
            element: (
              <Lazy>
                <CoursePage />
              </Lazy>
            ),
          },
          {
            path: 'lesson/:lessonId',
            element: (
              <Lazy>
                <LessonPage />
              </Lazy>
            ),
          },
          {
            path: 'lesson/:lessonId/skill-check',
            element: (
              <Lazy>
                <SkillCheckPage />
              </Lazy>
            ),
          },
          {
            path: 'table/:id',
            element: (
              <Lazy>
                <TablePage />
              </Lazy>
            ),
          },
          {
            path: 'casino',
            element: (
              <Lazy>
                <CasinoLobbyPage />
              </Lazy>
            ),
          },
          {
            path: 'casino/:tableId',
            element: (
              <Lazy>
                <CasinoTablePage />
              </Lazy>
            ),
          },
          {
            path: 'glossary',
            element: (
              <Lazy>
                <GlossaryPage />
              </Lazy>
            ),
          },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
