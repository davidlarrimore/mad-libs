import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

// StrictMode intentionally disabled: it double-invokes effects in dev, which would
// fire the paid DALL-E call twice per Mad Lib selection.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
