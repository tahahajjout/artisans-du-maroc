import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [showForgot, setShowForgot]           = useState(false);
        const [forgotEmail, setForgotEmail]         = useState('');
        const [forgotStep, setForgotStep]           = useState(1);
        const [forgotError, setForgotError]         = useState('');
        const [forgotLoading, setForgotLoading]     = useState(false);
        const [clientId, setClientId]             = useState(null);
        const [resetCode, setResetCode]             = useState('');
        const [newPassword, setNewPassword]         = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [successMsg, setSuccessMsg]           = useState('');
        

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Réinitialiser l'erreur

        try {
            // URL mise à jour avec /api/auth/login
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { 
                email, 
                password 
            });
            
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('clientToken', response.data.token);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || "Identifiants incorrects");
        }
    };

    const closeForgot = () => {
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotError('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('');
        setClientId(null);
    };

    const handleSendCode = async () => {
        if (!forgotEmail.trim()) { setForgotError("Veuillez entrer votre email."); return; }
        setForgotLoading(true); setForgotError('');
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { email: forgotEmail });
            setClientId(res.data.clientId);
            setForgotStep(2);
        } catch (err) {
            const msg = err.response?.data?.message;
            setForgotError(typeof msg === 'string' ? msg : "Erreur lors de l'envoi.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!resetCode.trim()) { setForgotError("Veuillez entrer le code."); return; }
        setForgotLoading(true); setForgotError('');
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-reset-code`, { clientId, code: resetCode });
            setForgotStep(3);
        } catch (err) {
            const msg = err.response?.data?.message;
            setForgotError(typeof msg === 'string' ? msg : "Code incorrect.");
        } finally {
            setForgotLoading(false);
        }
    };

      const handleResetPassword = async () => {
        if (!newPassword) { setForgotError("Veuillez entrer un nouveau mot de passe."); return; }
        if (newPassword !== confirmPassword) { setForgotError("Les mots de passe ne correspondent pas."); return; }
        setForgotLoading(true); setForgotError('');
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, { clientId, newPassword });
            setSuccessMsg("Mot de passe mis à jour ! Vous pouvez vous connecter.");
            setForgotStep(4);
        } catch (err) {
            const msg = err.response?.data?.message;
            setForgotError(typeof msg === 'string' ? msg : "Erreur lors de la mise à jour.");
        } finally {
            setForgotLoading(false);
        }
    };


    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="logo-login">ARTISANS DU MAROC</h1>
                <h2>Connexion Client</h2>
                
                {error && <div className="error-message" style={{color: 'red', marginBottom: '15px', fontSize: '0.85rem'}}>{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com" 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Mot de passe</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            required 
                        />
                    </div>

                    <button type="submit" className="login-btn">SE CONNECTER</button>
                </form>
                    <div className="login-footer">
                    <button
                   onClick={() => setShowForgot(true)}
                    style={{ background: 'none', border: 'none', color: '#b95d2b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}
                    >
                           🔑 Mot de passe oublié ?
                     </button>
                    </div>
                <div className="login-footer">
                    <p>Nouveau ici ? <Link to="/register">S'inscrire</Link></p>
                    <Link to="/" className="back-home">← Retour à l'accueil</Link>
                </div>
            </div>

             {/* ── Forgot Password Popup ── */}
            {showForgot && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }} onClick={closeForgot}>
                    <div style={{
                        background: 'white', borderRadius: '20px', padding: '36px',
                        width: '100%', maxWidth: '420px', position: 'relative',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                    }} onClick={e => e.stopPropagation()}>

                        <button onClick={closeForgot} style={{
                            position: 'absolute', top: '14px', right: '16px',
                            background: '#f0ece6', border: 'none', borderRadius: '50%',
                            width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px'
                        }}>✕</button>

                        <h3 style={{ color: '#b95d2b', marginBottom: '6px', fontSize: '1.1rem' }}>
                            🔑 Mot de passe oublié
                        </h3>

                        {/* Progress bar */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                            {[1, 2, 3].map(s => (
                                <div key={s} style={{
                                    flex: 1, height: '4px', borderRadius: '2px',
                                    background: forgotStep >= s ? '#b95d2b' : '#eee'
                                }} />
                            ))}
                        </div>

                        {forgotError && (
                            <p style={{ color: '#e74c3c', fontSize: '0.82rem', marginBottom: '12px' }}>
                                {forgotError}
                            </p>
                        )}

                        {/* STEP 1 — Email */}
                        {forgotStep === 1 && (
                            <>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
                                    Entrez votre email. Un code de réinitialisation sera envoyé automatiquement à cette adresse.
                                </p>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                                    placeholder="votre@email.com"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', marginTop: '8px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                                <button
                                    onClick={handleSendCode}
                                    disabled={forgotLoading}
                                    style={{ width: '100%', padding: '13px', background: '#b95d2b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    {forgotLoading ? 'Envoi en cours...' : 'Envoyer le code'}
                                </button>
                            </>
                        )}

                        {/* STEP 2 — Code */}
                        {forgotStep === 2 && (
                            <>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
                                    Un code à 5 chiffres a été envoyé à <strong>{forgotEmail}</strong>. Vérifiez votre boîte mail (et vos spams).
                                </p>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Code à 5 chiffres
                                </label>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={resetCode}
                                    onChange={e => { setResetCode(e.target.value.replace(/\D/g, '')); setForgotError(''); }}
                                    placeholder="_ _ _ _ _"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        border: '1px solid #eee', marginTop: '8px', marginBottom: '16px',
                                        boxSizing: 'border-box', fontFamily: 'inherit',
                                        textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px'
                                    }}
                                />
                                <button
                                    onClick={handleVerifyCode}
                                    disabled={forgotLoading}
                                    style={{ width: '100%', padding: '13px', background: '#b95d2b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    {forgotLoading ? 'Vérification...' : 'Vérifier le code'}
                                </button>
                                <button
                                    onClick={() => { setForgotStep(1); setForgotError(''); setResetCode(''); }}
                                    style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.82rem' }}
                                >
                                    ← Changer d'email
                                </button>
                            </>
                        )}

                        {/* STEP 3 — New password */}
                        {forgotStep === 3 && (
                            <>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
                                    Code vérifié ✅ Choisissez votre nouveau mot de passe.
                                </p>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setForgotError(''); }}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', marginTop: '8px', marginBottom: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setForgotError(''); }}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        border: confirmPassword && newPassword !== confirmPassword ? '1px solid #e74c3c' : '1px solid #eee',
                                        marginTop: '8px', marginBottom: '4px', boxSizing: 'border-box', fontFamily: 'inherit'
                                    }}
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p style={{ color: '#e74c3c', fontSize: '0.78rem', marginBottom: '8px' }}>
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                                <button
                                    onClick={handleResetPassword}
                                    disabled={forgotLoading}
                                    style={{ width: '100%', marginTop: '12px', padding: '13px', background: '#b95d2b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    {forgotLoading ? 'Mise à jour...' : 'ENREGISTRER LE MOT DE PASSE'}
                                </button>
                            </>
                        )}

                        {/* STEP 4 — Success */}
                        {forgotStep === 4 && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                <p style={{ color: '#27ae60', fontWeight: '600', marginBottom: '20px' }}>
                                    {successMsg}
                                </p>
                                <button
                                    onClick={closeForgot}
                                    style={{ padding: '12px 30px', background: '#b95d2b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Se connecter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;