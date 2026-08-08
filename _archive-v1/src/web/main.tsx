/**
 * Point d'entree React — PromoScan frontend.
 * Monte l'application avec les styles globaux et les tokens CSS.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import 'leaflet/dist/leaflet.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Element #root introuvable dans index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
