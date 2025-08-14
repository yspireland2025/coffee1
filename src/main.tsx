import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('=== MAIN.TSX LOADING ===');

const rootElement = document.getElementById('root');
console.log('=== ROOT ELEMENT FOUND ===', !!rootElement);

if (rootElement) {
  console.log('=== CREATING REACT ROOT ===');
  const root = ReactDOM.createRoot(rootElement);
  console.log('=== RENDERING FULL APP ===');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('=== RENDER COMPLETE ===');
} else {
  console.error('=== ROOT ELEMENT NOT FOUND ===');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found!</div>';
}