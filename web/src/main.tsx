import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { ProgressProvider } from './lib/progress/ProgressProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './lib/firebase'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
)
