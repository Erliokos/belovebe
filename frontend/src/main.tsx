import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n/config'
import { GlobalStyles } from './globalStyle.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <GlobalStyles/>
  </React.StrictMode>,
)

