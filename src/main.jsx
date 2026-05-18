import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Redirect www -> apex before rendering anything
if (window.location.hostname === 'www.nanotoxi.com') {
  window.location.replace(
    window.location.href.replace('//www.nanotoxi.com', '//nanotoxi.com')
  )
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
