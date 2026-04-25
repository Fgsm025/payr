import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { useAppStore } from './store/useAppStore'

function AuthBootstrap() {
  const bootstrapAuth = useAppStore((state) => state.bootstrapAuth)
  useEffect(() => {
    bootstrapAuth()
  }, [bootstrapAuth])
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthBootstrap />
    </BrowserRouter>
  </StrictMode>,
)
