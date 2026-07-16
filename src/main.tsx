import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for ultra-low latency and offline fallback
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SureDev SW registered:', reg.scope))
      .catch((err) => console.warn('SureDev SW registration failed:', err));
  });
} else if ('serviceWorker' in navigator) {
  // Also register in dev mode if requested, but with safety check
  navigator.serviceWorker.register('/sw.js')
    .then((reg) => console.log('SureDev SW registered (dev):', reg.scope))
    .catch((err) => console.warn('SureDev SW registration failed (dev):', err));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

