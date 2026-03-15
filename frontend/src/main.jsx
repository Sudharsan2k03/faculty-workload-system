import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'

// Catch global unhandled rejections and errors for tracking blank screens
window.addEventListener('error', (event) => {
  console.error("Global runtime error caught:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("Global async rejection caught:", event.reason);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
