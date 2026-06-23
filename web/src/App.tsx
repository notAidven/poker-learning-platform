import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  GuestOnlyRoute,
  ProfileSetupRoute,
  ProtectedRoute,
} from './components/ProtectedRoute'
import { CoursePage } from './pages/CoursePage'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { SignUpPage } from './pages/SignUpPage'
import { SkillCheckPage } from './pages/SkillCheckPage'

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
          { path: 'course', element: <CoursePage /> },
          { path: 'lesson/:lessonId', element: <LessonPage /> },
          { path: 'lesson/:lessonId/skill-check', element: <SkillCheckPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
