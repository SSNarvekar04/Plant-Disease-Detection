import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * Application entry point.
 * StrictMode surfaces side effects that run twice in development, which keeps
 * the async data hooks honest.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);