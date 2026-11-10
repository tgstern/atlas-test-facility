import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LabProvider } from './lab.jsx'
import './styles.css'

// Boot Pendo once, anonymously. LabProvider identifies the signed-in persona.
window.pendo.initialize({ visitor: { id: '' } })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '')}>
      <LabProvider>
        <App />
      </LabProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
