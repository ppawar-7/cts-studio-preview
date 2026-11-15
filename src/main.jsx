import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';
import './styles/global.css';
import './styles/app.css';

// Client-side SPA path-to-hash normalizer for GitHub Pages & deep links
(function normalizePathToHash() {
  const path = window.location.pathname;
  const repoBase = '/cts-studio-preview';
  let route = path;
  if (route.startsWith(repoBase)) {
    route = route.slice(repoBase.length);
  }
  if (route && route !== '/' && !window.location.hash) {
    if (!route.startsWith('/')) route = '/' + route;
    const target = (path.startsWith(repoBase) ? repoBase : '') + '/#' + route + window.location.search;
    window.location.replace(target);
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </HashRouter>
  </React.StrictMode>
);
