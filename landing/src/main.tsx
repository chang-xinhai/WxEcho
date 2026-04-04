import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Show scrollbar only when scrolling
let scrollTimeout: number;
const handleScroll = () => {
  document.body.classList.add('scrolling');
  clearTimeout(scrollTimeout);
  scrollTimeout = window.setTimeout(() => {
    document.body.classList.remove('scrolling');
  }, 500);
};

window.addEventListener('scroll', handleScroll, { passive: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
