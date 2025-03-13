import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';
import App from './App';

// Simple index.js without service worker registration
console.log('Starting application with simplified index.js');

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
