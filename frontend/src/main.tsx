import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import * as pdfjsLib from 'pdfjs-dist'

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
