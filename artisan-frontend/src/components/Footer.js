import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { useCurrency } from './CurrencyContext';

export default function Footer() {
  const { currency, setCurrency } = useCurrency();

  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-logo">ARTISANS DU MAROC</span>
          <p>L'artisanat marocain authentique</p>
        </div>

        <div className="footer-links">
          <Link to="/category/Tapis">Tapis</Link>
          <Link to="/category/Céramique">Céramique</Link>
          <Link to="/category/Cuir">Cuir</Link>
          <Link to="/category/Bijoux">Bijoux</Link>
          <Link to="/artisan-space">Espace artisan</Link>
          <Link to="/login">Connexion</Link>
        </div>

        <div className="footer-currency">
          <label>💱 Devise</label>
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