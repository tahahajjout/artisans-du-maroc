import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminToken', res.data.token);
                navigate('/admin/dashboard');
            }
        } catch {
            setError('Nom d\'utilisateur ou mot de passe incorrect');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo-login">ARTISANS</div>
                <h2>Espace Administrateur</h2>
                <p className="login-subtitle">Connectez-vous pour accéder au tableau de bord</p>

                {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</p>}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            placeholder="admin"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">SE CONNECTER</button>
                </form>

                <div className="login-footer">
                    <Link to="/" className="back-home">← Retour à l'accueil</Link>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;