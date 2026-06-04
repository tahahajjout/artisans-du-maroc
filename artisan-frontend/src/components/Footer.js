import React from 'react';
import './Footer.css';
import { useCurrency } from './CurrencyContext';
import logoImg from '../logo.png';

export default function Footer() {
  const { currency, setCurrency } = useCurrency();

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Left — brand */}
        <div className="footer-brand">
          <div className="footer-brand-row">
            <img src={logoImg} alt="Logo" className="footer-logo-image" />
            <span className="footer-logo">ARTISANS DU MAROC</span>
          </div>
          <p className="footer-tagline">L'artisanat marocain authentique</p>
        </div>

        {/* Center — contact */}
        <div className="footer-center">
          <p className="footer-section-title">Contact</p>
          <a href="mailto:contact@artisansdumaroc.ma" className="footer-email">
            artisansdumarocc@gmail.com
          </a>
        </div>

        {/* Right — currency */}
        <div className="footer-right">
          <p className="footer-section-title">Devise</p>
          <select
            className="currency-select"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          >
            <option value="MAD">🇲🇦 MAD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="GBP">🇬🇧 GBP</option>
          </select>
        </div>

      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Artisans du Maroc — Tous droits réservés
      </div>
    </footer>
  );
}