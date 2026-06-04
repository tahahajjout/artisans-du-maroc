import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './artisan_style/global_artisan.css';
import './artisan_style/profile.css';

function ArtisanProfile() {
    const navigate = useNavigate();
    const [showDelete, setShowDelete]       = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError]     = useState('');
    const [showPending, setShowPending]     = useState(false);

    const userData = localStorage.getItem('user');
    const artisan  = userData ? JSON.parse(userData) : null;

    useEffect(() => {
        if (!artisan) { navigate('/artisan-space'); return; }
        if (artisan.status === 'en_attente') setShowPending(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) { setDeleteError("Veuillez entrer votre mot de passe."); return; }
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/artisan/${artisan.id}`, {
                data: { password: deletePassword }
            });
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
        } catch (err) {
            setDeleteError(err.response?.data?.message || "Erreur lors de la suppression.");
        }
    };

    return (
        <div className="artisan-dashboard">
            <aside className="artisan-sidebar">
                <div className="profile-img-frame">
                    <img
                        src={artisan?.profile_picture
                            ? `${process.env.REACT_APP_API_URL}/uploads/${artisan.profile_picture}`
                            : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                        alt="Profil"
                        onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; }}
                    />
                </div>
                <nav>
                    <div className="nav-item active">👤 Mon Profil</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/products')}>📦 Mes Produits</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/add-product')}>✨ Ajouter Produit</div>
                    <div className="nav-item logout-item" onClick={handleLogout}>🚪 Déconnexion</div>
                </nav>
            </aside>

            <main className="artisan-main">
                <div className="artisan-card">
                    <h2 className="card-title">Mon Profil Artisan</h2>

                    <div className="profile-grid">
                        <div className="p-item">
                            <p className="info-label">Nom Complet</p>
                            <p className="info-value">{artisan?.full_name || "N/A"}</p>
                        </div>

                        <div className="p-item">
                            <p className="info-label">Email Professionnel</p>
                            <p className="info-value">{artisan?.email || "N/A"}</p>
                        </div>

                        <div className="p-item">
                            <p className="info-label">Ville</p>
                            <p className="info-value">{artisan?.city || "Non renseigné"}</p>
                        </div>

                        <div className="p-item">
                            <p className="info-label">Statut du compte</p>
                            <div>
                                {artisan?.status === 'actif' ? (
                                    <>
                                        <span className="status-badge actif">
                                            <span className="status-dot"></span>
                                            Actif
                                        </span>
                                        <p className="status-hint">Votre compte est visible publiquement</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="status-badge en_attente">
                                            <span className="status-dot"></span>
                                            En attente
                                        </span>
                                        <p className="status-hint">Votre compte est en cours de validation</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bio-section">
                            <p className="info-label">Ma Biographie</p>
                            <p className="bio-text">{artisan?.bio || "Aucune biographie rédigée."}</p>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button className="btn-edit" onClick={() => navigate('/artisan/edit-profile')}>
                            MODIFIER LE PROFIL
                        </button>
                        <button className="btn-delete-link" onClick={() => setShowDelete(true)}>
                            Supprimer mon compte
                        </button>
                    </div>
                </div>
            </main>

            {/* ── En attente popup ── */}
            {showPending && (
                <div className="modal-overlay">
                    <div className="modal-content modal-pending">
                        <div className="pending-icon">⏳</div>
                        <h2 className="pending-title">Compte en attente</h2>
                        <p className="pending-text">
                            Votre compte est en cours de validation par notre équipe.
                            Vous serez notifié par email dès que votre compte sera activé.
                        </p>
                        <button
                            className="btn-pending-back"
                            onClick={() => { setShowPending(false); navigate('/artisan-space'); }}
                        >
                            Retour à la connexion
                        </button>
                    </div>
                </div>
            )}

            {/* ── Delete popup ── */}
            {showDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-danger-title">⚠️ Attention</h2>
                        <p className="modal-desc">
                            Cette action est irréversible. Entrez votre mot de passe pour confirmer la suppression.
                        </p>
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            className="art-input"
                            value={deletePassword}
                            onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                        />
                        {deleteError && <p className="modal-error">{deleteError}</p>}
                        <div className="modal-actions">
                            <button className="btn-confirm" onClick={handleDeleteAccount}>CONFIRMER</button>
                            <button className="btn-cancel" onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteError(''); }}>ANNULER</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArtisanProfile;