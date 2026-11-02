import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './game.css';
import { isTouch } from '../shared/device';

if (isTouch()) document.documentElement.classList.add('is-touch');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
