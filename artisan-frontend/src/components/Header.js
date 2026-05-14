import React from 'react';

function Header({ userStatus }) {
    return (
        <header className="site-header">
            <div className="header-content">
                <h1>ARTISANS DU MAROC</h1>
                <div className="menu-section">
                    {/* Shows "Visitor" or the person's name as requested */}
                    <span className="status-label">{userStatus}</span>
                    <button className="hamburger-icon">☰</button>
                </div>
            </div>
        </header>
    );
}

export default Header;