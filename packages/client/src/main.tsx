import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Preview from './pages/Preview'
import '@styles/variable.scss'
import '@styles/reset.css'
import '@styles/global.scss'
import '@styles/dark.scss'
import '@styles/animate.scss'
import Beiwanglu from './pages/beiwanglu.tsx'

// Create router with routes for App and Preview
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/preview',
    element: <Preview />
  },
  {
    // Separate route for screenshot mode
    path: '/preview/screenshot',
    element: <Preview isScreenshot={true} />
  },
  {
    path: '/beiwanglu',
    element: <Beiwanglu />
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
