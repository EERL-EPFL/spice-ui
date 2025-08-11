import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    // Render logic moved inside the null check
    root.render(<App />);
} else {
    console.error("Root container not found");
}
