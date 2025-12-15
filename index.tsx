import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for script loading issues
window.addEventListener('error', (event) => {
  console.error("Global script error:", event);
  const errorOverlay = document.getElementById('error-overlay');
  const errorMessage = document.getElementById('error-message');
  if (errorOverlay && errorMessage) {
    errorOverlay.style.display = 'flex';
    errorMessage.textContent = "运行错误: " + (event.message || "未知错误");
  }
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to mount React app:", error);
  const errorOverlay = document.getElementById('error-overlay');
  const errorMessage = document.getElementById('error-message');
  if (errorOverlay && errorMessage) {
    errorOverlay.style.display = 'flex';
    errorMessage.textContent = "程序初始化错误: " + (error instanceof Error ? error.message : String(error));
  }
}