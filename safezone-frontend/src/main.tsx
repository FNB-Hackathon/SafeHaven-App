import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Home from './routes/Home'
import Contacts from './routes/Contacts'
import Report from './routes/Report'
import MapRoute from './routes/Map'
import LiveView from './routes/LiveView'
import Hotlines from './routes/Hotlines'
import Qr from './routes/Qr'
import './styles.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'contacts', element: <Contacts /> },
      { path: 'report', element: <Report /> },
      { path: 'map', element: <MapRoute /> },
      { path: 'live/:token', element: <LiveView /> },
      { path: 'hotlines', element: <Hotlines /> },
      { path: 'qr', element: <Qr /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)

// Register service worker for PWA install/offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
