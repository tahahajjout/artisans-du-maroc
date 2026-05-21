import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './artisan_style/global_artisan.css';
import './artisan_style/products.css';

function MyProducts() {
    const navigate = useNavigate();
    const [products, setProducts]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [commentsPopup, setCommentsPopup]   = useState(null);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm]   = useState(null);
    const [sortBy, setSortBy]                 = useState('none');
    const [galleryPopup, setGalleryPopup]     = useState(null); // { product, gallery }
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [galleryLightbox, setGalleryLightbox] = useState(null); // { url, type }

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;

    useEffect(() => {
        if (!userId) { navigate('/artisan-login'); return; }
        axios.get(`http://localhost:5000/api/products/artisan/${userId}`)
            .then(res => { setProducts(res.data); setLoading(false); })
            .catch(err => { console.error("Erreur chargement produits:", err); setLoading(false); });
    }, [userId, navigate]);

    const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/products/${deleteConfirm}`);
            setProducts(products.filter(p => p.id !== deleteConfirm));
            setDeleteConfirm(null);
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    const handleShowComments = async (product) => {
        setCommentsLoading(true);
        setCommentsPopup({ productTitle: product.title, comments: [] });
        try {
            const res = await axios.get(`http://localhost:5000/api/products/${product.id}/comments`);
            setCommentsPopup({ productTitle: product.title, comments: res.data });
        } catch {
            setCommentsPopup({ productTitle: product.title, comments: [] });
        }
        setCommentsLoading(false);
    };

    const handleShowGallery = async (product) => {
        setGalleryLoading(true);
        setGalleryPopup({ product, gallery: [] });
        try {
            const res = await axios.get(`http://localhost:5000/api/products/${product.id}`);
            setGalleryPopup({ product, gallery: res.data.gallery || [] });
        } catch {
            setGalleryPopup({ product, gallery: [] });
        }
        setGalleryLoading(false);
    };

    const renderStars = (stars) => '★'.repeat(stars) + '☆'.repeat(5 - stars);

    const sidebarImg = user?.profile_picture?.startsWith('http')
        ? user.profile_picture
        : `http://localhost:5000/uploads/${user?.profile_picture}`;

    if (loading) return <div className="artisan-main">Chargement de vos créations...</div>;

    const sortedProducts = [...products].sort((a, b) => {
        if (sortBy === 'nom') return a.title.localeCompare(b.title);
        if (sortBy === 'rating') return b.average_rating - a.average_rating;
        if (sortBy === 'visites') return (b.visit_count || 0) - (a.visit_count || 0);
        return 0;   
    });

    return (
        <div className="artisan-dashboard">
            <aside className="artisan-sidebar">
                <div className="profile-img-frame">
                    <img src={sidebarImg} alt="Profil"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/110'} />
                </div>
                <nav>
                    <div className="nav-item" onClick={() => navigate('/artisan-profile')}>👤 Mon Profil</div>
                    <div className="nav-item active">📦 Mes Produits</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/add-product')}>✨ Ajouter Produit</div>
                </nav>
            </aside>

            <main className="artisan-main" style={{ display: 'block' }}>
                <h2 style={{ color: '#b35935', marginBottom: '24px', textAlign: 'center' }}>
                    Mes Créations ({products.length})
                </h2>

                <div className="sort-bar">
                    <span className="sort-label">Trier par :</span>
                    {['none', 'nom', 'rating', 'visites'].map(val => (
                        <button key={val}
                            className={`sort-btn ${sortBy === val ? 'active' : ''}`}
                            onClick={() => setSortBy(val)}>
                            {val === 'none' ? 'Par défaut' : val === 'nom' ? 'Nom' : val === 'rating' ? '★ Note' : '👁 Visites'}
                        </button>
                    ))}
                </div>

                <div className="products-grid">
                    {products.length === 0 ? (
                        <p style={{ textAlign: 'center', gridColumn: 'span 4' }}>
                            Vous n'avez pas encore de produits.
                        </p>
                    ) : (
                        sortedProducts.map(p => (
                            <div className="product-card" key={p.id}>
                                {/* Clickable image → gallery popup */}
                                <div className="product-img-container"
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                    onClick={() => handleShowGallery(p)}>
                                    <img
                                        src={`http://localhost:5000/uploads/${p.image_url}`}
                                        className="product-img"
                                        alt={p.title}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                                    />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0, transition: 'opacity 0.2s',
                                        borderRadius: '0'
                                    }}
                                        className="product-img-hover-overlay">
                                        <span style={{ color: 'white', fontSize: '22px' }}>🖼 Galerie</span>
                                    </div>
                                </div>
                                <div className="product-body">
                                    <h3 className="product-title">{p.title}</h3>
                                    <p className="product-price">{p.price}.00 DH</p>
                                    <div className="product-rating">
                                        <span className="rating-stars">
                                            {'★'.repeat(Math.round(p.average_rating))}
                                            {'☆'.repeat(5 - Math.round(p.average_rating))}
                                        </span>
                                        <span className="rating-score">
                                            {Number(p.average_rating).toFixed(1)} ({p.rating_count} avis)
                                        </span>
                                    </div>
                                    <div className="product-visits">
                                        👁 {p.visit_count || 0} vue{p.visit_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="product-actions">
                                    <button className="btn-card btn-comments" onClick={() => handleShowComments(p)}>
                                        💬 Commentaires
                                    </button>
                                    <button className="btn-card btn-modifier"
                                        onClick={() => navigate(`/artisan/edit-product/${p.id}`)}>
                                        Modifier
                                    </button>
                                    <button className="btn-card btn-supprimer"
                                        onClick={() => setDeleteConfirm(p.id)}>
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* ── DELETE CONFIRM ── */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}
                        style={{ textAlign: 'center', maxWidth: '420px' }}>
                        <h2 style={{ color: '#e74c3c', marginBottom: '16px' }}>⚠️ Confirmer la suppression</h2>
                        <p style={{ color: '#666', marginBottom: '28px', lineHeight: '1.6' }}>
                            Cette action est irréversible. Voulez-vous vraiment supprimer ce produit ?
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleDelete}
                                style={{ flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                SUPPRIMER
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                                style={{ flex: 1, padding: '12px', background: '#eee', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                                ANNULER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── COMMENTS POPUP ── */}
            {commentsPopup && (
                <div className="modal-overlay" onClick={() => setCommentsPopup(null)}>
                    <div className="modal-content comments-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setCommentsPopup(null)}>✕</button>
                        <h2 style={{ color: '#b35935', marginBottom: '6px' }}>💬 Commentaires</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
                            {commentsPopup.productTitle}
                        </p>
                        {commentsLoading ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Chargement...</p>
                        ) : commentsPopup.comments.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Aucun commentaire pour ce produit.</p>
                        ) : (
                            <table className="comments-table">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Note</th>
                                        <th>Commentaire</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commentsPopup.comments.map((c, i) => (
                                        <tr key={i}>
                                            <td className="comment-client">{c.client_name}</td>
                                            <td className="comment-stars" style={{ color: '#b35935', whiteSpace: 'nowrap' }}>
                                                {renderStars(c.stars)} {c.stars}/5
                                            </td>
                                            <td className="comment-text">{c.comment || <span style={{ color: '#ccc' }}>—</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── GALLERY POPUP ── */}
            {galleryPopup && (
                <div className="modal-overlay" onClick={() => setGalleryPopup(null)}>
                    <div className="modal-content comments-modal" onClick={e => e.stopPropagation()}
                        style={{ position: 'relative' }}>
                        <button className="modal-close" onClick={() => setGalleryPopup(null)}>✕</button>
                        <h2 style={{ color: '#b35935', marginBottom: '6px' }}>🖼 Galerie</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
                            {galleryPopup.product.title}
                        </p>

                        {galleryLoading ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Chargement...</p>
                        ) : (
                            <>
                                {/* Main image */}
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                        Image principale
                                    </p>
                                    <img
                                        src={`http://localhost:5000/uploads/${galleryPopup.product.image_url}`}
                                        alt="main"
                                        onClick={() => setGalleryLightbox({
                                            url: `http://localhost:5000/uploads/${galleryPopup.product.image_url}`,
                                            type: 'image'
                                        })}
                                        style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in' }}
                                        onError={e => e.target.src = 'https://via.placeholder.com/400'}
                                    />
                                </div>

                                {/* Gallery items */}
                                {galleryPopup.gallery.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
                                        Aucun média supplémentaire dans la galerie.
                                    </p>
                                ) : (
                                    <>
                                        <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                            Galerie ({galleryPopup.gallery.length} média{galleryPopup.gallery.length > 1 ? 's' : ''})
                                        </p>
                                        <div className="gallery-preview-grid">
                                            {galleryPopup.gallery.map(g => (
                                                <div key={g.id} className="gallery-preview-item"
                                                    onClick={() => setGalleryLightbox({
                                                        url: `http://localhost:5000/uploads/${g.file_url}`,
                                                        type: g.file_type
                                                    })}>
                                                    {g.file_type === 'video'
                                                        ? <video src={`http://localhost:5000/uploads/${g.file_url}`}
                                                            className="gallery-thumb" muted />
                                                        : <img src={`http://localhost:5000/uploads/${g.file_url}`}
                                                            alt="gallery" className="gallery-thumb" />}
                                                    <span className="gallery-type-badge">
                                                        {g.file_type === 'video' ? '🎥' : '🔍'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── GALLERY LIGHTBOX ── */}
            {galleryLightbox && (
                <div className="gallery-lightbox" onClick={() => setGalleryLightbox(null)}>
                    <button className="gallery-lightbox-close" onClick={() => setGalleryLightbox(null)}>✕</button>
                    {galleryLightbox.type === 'video'
                        ? <video src={galleryLightbox.url} controls autoPlay
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px' }} />
                        : <img src={galleryLightbox.url} alt="preview"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
                    }
                </div>
            )}
        </div>
    );
}

export default MyProducts;