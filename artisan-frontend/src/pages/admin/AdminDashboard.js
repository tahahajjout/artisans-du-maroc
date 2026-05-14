import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './admin_style.css';

function AdminDashboard() {
    const [clients, setClients]             = useState([]);
    const [artisans, setArtisans]           = useState([]);
    const [activeTab, setActiveTab]         = useState('clients');
    const [ratingFilter, setRatingFilter]   = useState('all');
    const [statusFilter, setStatusFilter]   = useState('all');
    const [artisanPopup, setArtisanPopup]   = useState(null);
    const [popupLoading, setPopupLoading]   = useState(false);
    const [deletePopup, setDeletePopup]     = useState(null);
    const [deleteReason, setDeleteReason]   = useState('');
    const [deleteError, setDeleteError]     = useState('');
    const [statusPopup, setStatusPopup]     = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('adminLoggedIn')) navigate('/admin/login');
        axios.get('http://localhost:5000/api/admin/clients').then(r => setClients(r.data));
        axios.get('http://localhost:5000/api/admin/artisans').then(r => setArtisans(r.data));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        navigate('/');
    };

    const handleArtisanClick = async (artisan) => {
        setPopupLoading(true);
        setArtisanPopup({ name: artisan.full_name, products: [] });
        try {
            const res = await axios.get(`http://localhost:5000/api/products/visits/artisan/${artisan.id}`);
            setArtisanPopup({ name: artisan.full_name, products: res.data });
        } catch {
            setArtisanPopup({ name: artisan.full_name, products: [] });
        }
        setPopupLoading(false);
    };

    const handleDeleteClick = (e, artisan) => {
        e.stopPropagation();
        setDeleteReason('');
        setDeleteError('');
        setDeletePopup(artisan);
    };

    const handleStatusClick = (e, artisan) => {
        e.stopPropagation();
        setStatusPopup(artisan);
    };

    const handleConfirmDelete = async () => {
        if (!deleteReason.trim()) { setDeleteError('Veuillez entrer une raison de suppression.'); return; }
        try {
            await axios.delete(`http://localhost:5000/api/admin/artisan/${deletePopup.id}`);
            const phone = deletePopup.phone_number ? deletePopup.phone_number.replace(/\D/g, '') : '212636823256';
            const message = encodeURIComponent(
                `Bonjour ${deletePopup.full_name},\n\nVotre compte artisan a été supprimé.\n\nRaison : ${deleteReason}\n\nCordialement,\nL'équipe Artisans du Maroc`
            );
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            setArtisans(artisans.filter(a => a.id !== deletePopup.id));
            setDeletePopup(null);
        } catch {
            setDeleteError("Erreur lors de la suppression. Veuillez réessayer.");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setStatusLoading(true);
        try {
            await axios.put(`http://localhost:5000/api/admin/artisan/${statusPopup.id}/status`, { status: newStatus });
            setArtisans(prev => prev.map(a => a.id === statusPopup.id ? { ...a, status: newStatus } : a));
            setStatusPopup(null);
        } catch {
            alert("Erreur lors de la mise à jour du statut.");
        } finally {
            setStatusLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const map = {
            actif:      { label: '✅ Actif',      cls: 'admin-status-actif' },
            en_attente: { label: '⏳ En attente', cls: 'admin-status-attente' },
            bloque:     { label: '🚫 Bloqué',     cls: 'admin-status-bloque' }
        };
        const s = map[status] || map['en_attente'];
        return <span className={`admin-status-badge ${s.cls}`}>{s.label}</span>;
    };

    const filtered = artisans.filter(a => {
        const ratingOk = ratingFilter === 'all' || (a.average_rating || 0) >= Number(ratingFilter);
        const statusOk = statusFilter === 'all' || a.status === statusFilter;
        return ratingOk && statusOk;
    });

    return (
        <div className="artisan-dashboard">
            {/* SIDEBAR */}
            <aside className="artisan-sidebar">
                <div className="admin-sidebar-logo">
                    <div className="admin-avatar">👑</div>
                    <p className="admin-label">Administrateur</p>
                </div>
                <nav>
                    <div className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                        👤 Clients
                    </div>
                    <div className={`nav-item ${activeTab === 'artisans' ? 'active' : ''}`} onClick={() => setActiveTab('artisans')}>
                        🧑‍🎨 Artisans
                    </div>
                    <div className="nav-item logout-item" onClick={handleLogout}>
                        🚪 Déconnexion
                    </div>
                </nav>
            </aside>

            {/* MAIN */}
            <main className="artisan-main">
                <div className="artisan-card">

                    {/* CLIENTS TAB */}
                    {activeTab === 'clients' && (
                        <>
                            <h2 className="card-title">Liste des Clients</h2>
                            <div className="admin-stats-badge">
                                {clients.length} client{clients.length !== 1 ? 's' : ''} inscrit{clients.length !== 1 ? 's' : ''}
                            </div>
                            {clients.length === 0 ? (
                                <p className="admin-empty">Aucun client pour le moment.</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nom complet</th>
                                            <th>Email</th>
                                            <th>Inscrit le</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((c, i) => (
                                            <tr key={c.id}>
                                                <td className="admin-index">{i + 1}</td>
                                                <td className="admin-name">{c.full_name}</td>
                                                <td>{c.email}</td>
                                                <td>{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {/* ARTISANS TAB */}
                    {activeTab === 'artisans' && (
                        <>
                            <h2 className="card-title">Liste des Artisans</h2>

                            {/* Filters */}
                            <div className="admin-filter-bar">
                                <span className="admin-filter-label">Note :</span>
                                {['all', '4', '3', '2', '1'].map(val => (
                                    <button key={val}
                                        className={`admin-filter-btn ${ratingFilter === val ? 'active' : ''}`}
                                        onClick={() => setRatingFilter(val)}>
                                        {val === 'all' ? 'Tous' : `${val}★+`}
                                    </button>
                                ))}
                                <span className="admin-filter-label" style={{ marginLeft: '14px' }}>Statut :</span>
                                {[
                                    { val: 'all',        label: 'Tous' },
                                    { val: 'actif',      label: '✅ Actif' },
                                    { val: 'en_attente', label: '⏳ En attente' },
                                    { val: 'bloque',     label: '🚫 Bloqué' }
                                ].map(s => (
                                    <button key={s.val}
                                        className={`admin-filter-btn ${statusFilter === s.val ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(s.val)}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="admin-stats-badge">
                                {filtered.length} artisan{filtered.length !== 1 ? 's' : ''}
                            </div>

                            {filtered.length === 0 ? (
                                <p className="admin-empty">Aucun artisan pour ce filtre.</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nom complet</th>
                                            <th>Email</th>
                                            <th>Ville</th>
                                            <th>Produits</th>
                                            <th>Note</th>
                                            <th>Statut</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((a, i) => (
                                            <tr key={a.id} className="admin-artisan-row"
                                                onClick={() => handleArtisanClick(a)}
                                                title="Cliquer pour voir les produits">
                                                <td className="admin-index">{i + 1}</td>
                                                <td className="admin-name">{a.full_name}</td>
                                                <td>{a.email}</td>
                                                <td>{a.city || '—'}</td>
                                                <td className="admin-product-count">
                                                    {a.product_count || 0} produit{a.product_count !== 1 ? 's' : ''}
                                                </td>
                                                <td className="admin-rating">
                                                    {a.average_rating
                                                        ? `★ ${a.average_rating}`
                                                        : <span style={{ color: '#ccc' }}>—</span>}
                                                </td>
                                                <td onClick={e => handleStatusClick(e, a)}
                                                    title="Cliquer pour modifier le statut"
                                                    style={{ cursor: 'pointer' }}>
                                                    <StatusBadge status={a.status} />
                                                </td>
                                                <td>
                                                    <button className="admin-delete-btn"
                                                        onClick={e => handleDeleteClick(e, a)}>
                                                        🗑 Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* ARTISAN PRODUCTS POPUP */}
            {artisanPopup && (
                <div className="modal-overlay" onClick={() => setArtisanPopup(null)}>
                    <div className="modal-content comments-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button className="modal-close" onClick={() => setArtisanPopup(null)}>✕</button>
                        <h2 style={{ color: '#b35935', marginBottom: '6px' }}>📦 Produits de l'artisan</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>{artisanPopup.name}</p>
                        {popupLoading ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Chargement...</p>
                        ) : artisanPopup.products.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Aucun produit pour cet artisan.</p>
                        ) : (
                            <table className="comments-table">
                                <thead>
                                    <tr><th>#</th><th>Produit</th><th>Prix</th><th>Note</th><th>Visites</th></tr>
                                </thead>
                                <tbody>
                                    {artisanPopup.products.map((p, i) => (
                                        <tr key={p.id}>
                                            <td style={{ color: '#bbb', fontWeight: 700 }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{p.title}</td>
                                            <td style={{ color: '#b35935', fontWeight: 600 }}>{Number(p.price).toFixed(2)} DH</td>
                                            <td style={{ color: '#f0a500' }}>
                                                {p.average_rating ? `★ ${Number(p.average_rating).toFixed(1)}` : <span style={{ color: '#ccc' }}>—</span>}
                                            </td>
                                            <td>👁 {p.visit_count || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* STATUS CHANGE POPUP */}
            {statusPopup && (
                <div className="modal-overlay" onClick={() => setStatusPopup(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}
                        style={{ position: 'relative', maxWidth: '400px' }}>
                        <button className="modal-close" onClick={() => setStatusPopup(null)}>✕</button>
                        <h2 style={{ color: '#b35935', marginBottom: '6px' }}>Modifier le statut</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>{statusPopup.full_name}</p>
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', color: '#aaa' }}>Statut actuel : </span>
                            <StatusBadge status={statusPopup.status} />
                        </div>
                        <div className="admin-status-actions">
                            {statusPopup.status !== 'actif' && (
                                <button onClick={() => handleUpdateStatus('actif')} disabled={statusLoading}
                                    className="admin-status-action-btn admin-status-action-actif">
                                    ✅ Activer le compte
                                </button>
                            )}
                            {statusPopup.status !== 'bloque' && (
                                <button onClick={() => handleUpdateStatus('bloque')} disabled={statusLoading}
                                    className="admin-status-action-btn admin-status-action-bloque">
                                    🚫 Bloquer le compte
                                </button>
                            )}
                            {statusPopup.status !== 'en_attente' && (
                                <button onClick={() => handleUpdateStatus('en_attente')} disabled={statusLoading}
                                    className="admin-status-action-btn admin-status-action-attente">
                                    ⏳ Remettre en attente
                                </button>
                            )}
                        </div>
                        {statusLoading && (
                            <p style={{ textAlign: 'center', color: '#aaa', marginTop: '12px', fontSize: '13px' }}>
                                Mise à jour en cours...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* DELETE ARTISAN POPUP */}
            {deletePopup && (
                <div className="modal-overlay" onClick={() => setDeletePopup(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}
                        style={{ position: 'relative', maxWidth: '500px', textAlign: 'left' }}>
                        <button className="modal-close" onClick={() => setDeletePopup(null)}>✕</button>
                        <h2 style={{ color: '#e74c3c', marginBottom: '6px' }}>🗑 Supprimer l'artisan</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>{deletePopup.full_name}</p>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                Raison de la suppression *
                            </label>
                            <textarea rows="4" value={deleteReason}
                                onChange={e => { setDeleteReason(e.target.value); setDeleteError(''); }}
                                placeholder="Expliquez la raison de la suppression de ce compte..."
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: deleteError ? '2px solid #e74c3c' : '1px solid #eee', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                            {deleteError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '6px' }}>{deleteError}</p>}
                        </div>
                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
                            📱 Un message WhatsApp sera envoyé à l'artisan avec la raison de la suppression.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleConfirmDelete}
                                style={{ flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                                CONFIRMER & ENVOYER
                            </button>
                            <button onClick={() => setDeletePopup(null)}
                                style={{ flex: 1, padding: '12px', background: '#eee', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
                                ANNULER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;