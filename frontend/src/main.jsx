import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import './index.css';

// Last line of defence: surface uncaught errors on the page itself, so a
// blank screen in production still tells us what went wrong.
function showFatal(msg) {
  let el = document.getElementById('fatal-error');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'fatal-error';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;margin:0;padding:12px 16px;background:#fef2f2;color:#991b1b;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap;z-index:99999;border-top:2px solid #fca5a5;max-height:40vh;overflow:auto';
    document.body.appendChild(el);
  }
  el.textContent += (el.textContent ? '\n' : '') + msg;
}
window.addEventListener('error', e => showFatal(`error: ${e.message} (${e.filename}:${e.lineno})`));
window.addEventListener('unhandledrejection', e => showFatal(`unhandled: ${e.reason?.stack || e.reason?.message || e.reason}`));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
