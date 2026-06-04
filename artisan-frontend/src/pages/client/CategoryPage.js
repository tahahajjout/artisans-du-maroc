import Footer from '../../components/Footer';
import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../components/CurrencyContext';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './CategoryPage.css';

function CategoryPage() {
    const { categoryName } = useParams();
    const { convert } = useCurrency();
    const [products, setProducts]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [galleryLightbox, setGalleryLightbox] = useState(null); // { url, type }

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/products/by-category/${categoryName}`)
            .then(res => { setProducts(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [categoryName]);

    const openProduct = (p) => {
        setSelectedProduct(p);
        setGalleryLightbox(null);
        const user = JSON.parse(localStorage.getItem('user'));
        axios.post(`${process.env.REACT_APP_API_URL}/api/products/${p.id}/visit`, {
            client_id: user ? user.id : null
        });
    };

    return (
        <div className="cat-page">
            {/* ── Header ── */}
            <header className="cat-header">
                <Link to="/" className="cat-back">← Accueil</Link>
                <h1 className="cat-title">{categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h1>
                <span className="cat-count">{products.length} création{products.length !== 1 ? 's' : ''}</span>
            </header>

            {/* ── Grid ── */}
            {loading ? (
                <p className="cat-loading">Chargement...</p>
            ) : products.length === 0 ? (
                <p className="cat-empty">Aucun produit dans cette catégorie pour le moment.</p>
            ) : (
                <div className="cat-grid">
                    {products.map(p => (
                        <div className="cat-card" key={p.id}>
                            <div className="cat-img-wrap">
                                <img
                                    src={`${process.env.REACT_APP_API_URL}/uploads/${p.image_url}`}
                                    alt={p.title}
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                                />
                                <div className="cat-rating">
                                    ★ {Number(p.average_rating || 0).toFixed(1)} ({p.rating_count || 0})
                                </div>
                                {p.gallery && p.gallery.length > 0 && (
                                    <div className="cat-gallery-count">🖼 +{p.gallery.length}</div>
                                )}
                            </div>
                            <div className="cat-card-body">
                                <h3 className="cat-product-name">{p.title}</h3>
                                <p className="cat-price">{convert(p.price)}</p>
                                <p className="cat-artisan-name">🧑‍🎨 {p.artisan_name}</p>
                                {/* Couleur & Dimensions tags */}
                                {(p.couleur || p.hauteur || p.largeur) && (
                                    <div className="cat-details-row">
                                        {p.couleur && <span className="cat-detail-tag">🎨 {p.couleur}</span>}
                                        {(p.hauteur || p.largeur) && (
                                            <span className="cat-detail-tag">
                                                📐 {[p.hauteur && `H:${p.hauteur}`, p.largeur && `L:${p.largeur}`].filter(Boolean).join(' ')}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button className="cat-btn-plus" onClick={() => openProduct(p)}>
                                    + Plus d'infos
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Product Popup ── */}
            {selectedProduct && (
                <div className="cat-overlay" onClick={() => { setSelectedProduct(null); setGalleryLightbox(null); }}>
                    <div className="cat-popup" onClick={(e) => e.stopPropagation()}>
                        <button className="cat-popup-close" onClick={() => { setSelectedProduct(null); setGalleryLightbox(null); }}>✕</button>

                        {/* Main image — clickable */}
                        <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${selectedProduct.image_url}`}
                            alt={selectedProduct.title}
                            className="cat-popup-img"
                            style={{ cursor: 'zoom-in' }}
                            onClick={() => setGalleryLightbox({
                                url: `${process.env.REACT_APP_API_URL}/uploads/${selectedProduct.image_url}`,
                                type: 'image'
                            })}
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400'}
                        />

                        <div className="cat-popup-body">
                            <h2 className="cat-popup-title">{selectedProduct.title}</h2>
                            <p className="cat-popup-price">{convert(selectedProduct.price)}</p>

                            {/* Couleur & Dimensions */}
                            <div className="cat-popup-details">
                                <span className="cat-detail-tag">🎨 {selectedProduct.couleur || 'Non spécifié'}</span>
                                <span className="cat-detail-tag">↕ H: {selectedProduct.hauteur || 'Non spécifié'}</span>
                                <span className="cat-detail-tag">↔ L: {selectedProduct.largeur || 'Non spécifié'}</span>
                            </div>

                            {selectedProduct.description && (
                                <p className="cat-popup-desc">{selectedProduct.description}</p>
                            )}

                            {/* Gallery */}
                            {selectedProduct.gallery && selectedProduct.gallery.length > 0 && (
                                <div className="cat-popup-gallery">
                                    <p className="cat-popup-gallery-label">
                                        Galerie ({selectedProduct.gallery.length})
                                    </p>
                                    <div className="cat-popup-gallery-grid">
                                        {selectedProduct.gallery.map(g => (
                                            <div key={g.id} className="cat-popup-gallery-item"
                                                onClick={() => setGalleryLightbox({
                                                    url: `${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`,
                                                    type: g.file_type
                                                })}>
                                                {g.file_type === 'video'
                                                    ? <video src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                        className="cat-popup-gallery-thumb" muted />
                                                    : <img src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                        alt="gallery" className="cat-popup-gallery-thumb" />}
                                                <span className="cat-popup-gallery-badge">
                                                    {g.file_type === 'video' ? '🎥' : '🔍'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="cat-popup-artisan">
                                <p className="cat-popup-artisan-name">🧑‍🎨 {selectedProduct.artisan_name}</p>
                                <p className="cat-popup-city">📍 {selectedProduct.artisan_city}</p>
                            </div>

                            <Link
                                to={`/artisan/${selectedProduct.artisan_id}/products`}
                                className="cat-popup-contact"
                                onClick={() => { setSelectedProduct(null); setGalleryLightbox(null); }}
                            >
                                Voir le profil & contacter →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox ── */}
            {galleryLightbox && (
                <div className="cat-lightbox" onClick={() => setGalleryLightbox(null)}>
                    <button className="cat-lightbox-close" onClick={() => setGalleryLightbox(null)}>✕</button>
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

            <Footer />
        </div>
    );
}

export default CategoryPage;