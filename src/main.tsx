import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './data/session'
import { StoreProvider } from './data/store'
import { ToastProvider } from './components/Toast'
import './styles/global.css'
import './styles/paper.css'
import './styles/landing.css'
import './styles/auth.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
