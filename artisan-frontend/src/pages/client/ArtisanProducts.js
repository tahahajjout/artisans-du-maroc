import React, { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '../../components/CurrencyContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ArtisanProducts.css';

const SORT_OPTIONS = [
    { value: 'rating',     label: '★ Meilleure note' },
    { value: 'alpha_asc',  label: 'A → Z' },
    { value: 'alpha_desc', label: 'Z → A' },
    { value: 'price_asc',  label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
];

function ArtisanProducts() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [products, setProducts]               = useState([]);
    const [artisanName, setArtisanName]         = useState('');
    const [loading, setLoading]                 = useState(true);
    const [sort, setSort]                       = useState('rating');
    const [category, setCategory]               = useState('');
    const [showFilters, setShowFilters]         = useState(false);
    const [ratingModal, setRatingModal]         = useState(null);
    const [stars, setStars]                     = useState(0);
    const [hoverStar, setHoverStar]             = useState(0);
    const [comment, setComment]                 = useState('');
    const [ratingMsg, setRatingMsg]             = useState('');
    const [submitting, setSubmitting]           = useState(false);
    const [commentsModal, setCommentsModal]     = useState(null);
    const [galleryModal, setGalleryModal]       = useState(null);
    const [galleryLightbox, setGalleryLightbox] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));
    const { convert } = useCurrency();

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/products/artisan/${id}/public`)
            .then(res => {
                setProducts(res.data);
                if (res.data.length > 0) setArtisanName(res.data[0].artisan_name);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
    }, [id]);

    const categories = useMemo(() => {
        const names = [...new Set(products.map(p => p.category_name))];
        return names.sort();
    }, [products]);

    const displayed = useMemo(() => {
        let list = category ? products.filter(p => p.category_name === category) : [...products];
        switch (sort) {
            case 'alpha_asc':  list.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'alpha_desc': list.sort((a, b) => b.title.localeCompare(a.title)); break;
            case 'price_asc':  list.sort((a, b) => a.price - b.price); break;
            case 'price_desc': list.sort((a, b) => b.price - a.price); break;
            default:           list.sort((a, b) => b.average_rating - a.average_rating || a.title.localeCompare(b.title));
        }
        return list;
    }, [products, sort, category]);

    const whatsappLink = (phone, productTitle) => {
        if (!phone) return '#';
        let clean = phone.replace(/\s/g, '').replace(/\D/g, '');
        if (clean.startsWith('212')) {
            // already has country code
        } else if (clean.startsWith('0')) {
            clean = '212' + clean.slice(1);
        } else {
            clean = '212' + clean;
        }
        const message = encodeURIComponent(`Bonjour, je suis intéressé par le produit : ${productTitle}`);
        return `https://wa.me/${clean}?text=${message}`;
    };

    const openRating = (product) => {
        setRatingModal(product);
        setStars(0); setHoverStar(0); setComment(''); setRatingMsg('');
    };

    const submitRating = async () => {
        if (stars === 0) { setRatingMsg("Veuillez sélectionner une note."); return; }
        setSubmitting(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/products/rate`, {
                product_id: ratingModal.id,
                client_id: user.id,
                stars,
                comment
            });
            setRatingMsg("✅ Merci ! Votre avis a été enregistré.");
            setTimeout(() => setRatingModal(null), 1500);
        } catch {
            setRatingMsg("❌ Erreur lors de l'envoi. Réessayez.");
        } finally {
            setSubmitting(false);
        }
    };

    const openGallery = (product) => {
        setGalleryModal(product);
        setGalleryLightbox(null);
    };

    const openComments = (e, product) => {
        e.stopPropagation();
        setCommentsModal({ title: product.title, comments: product.comments || [] });
    };

    return (
        <div className="ap-page">
            {/* ── Header ── */}
            <header className="ap-header">
                <button className="ap-back" onClick={() => navigate(`/artisan/${id}`)}>‹</button>
                <div className="ap-header-titles">
                    <span className="ap-header-sub">MES CRÉATIONS:</span>
                    <span className="ap-header-main">{artisanName.toUpperCase()}</span>
                </div>
                <button className="ap-menu-btn" onClick={() => setShowFilters(v => !v)}>☰</button>
            </header>

            {/* ── Section title ── */}
            <div className="ap-section-title">
                <h2>MES CRÉATIONS:<br /><span>{artisanName.toUpperCase()}</span></h2>
            </div>

            {/* ── Filter bar ── */}
            <div className="ap-filter-bar">
                <button className={`ap-filter-toggle ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(v => !v)}>
                    ⚙ Filtrer
                </button>
            </div>

            {showFilters && (
                <div className="ap-filters-panel">
                    <div className="ap-filter-group">
                        <label>Trier par</label>
                        <div className="ap-sort-pills">
                            {SORT_OPTIONS.map(o => (
                                <button key={o.value}
                                    className={`ap-pill ${sort === o.value ? 'selected' : ''}`}
                                    onClick={() => setSort(o.value)}>
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ap-filter-group">
                        <label>Catégorie</label>
                        <select className="ap-cat-select" value={category}
                            onChange={e => setCategory(e.target.value)}>
                            <option value="">Toutes les catégories</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* ── Product list ── */}
            {loading ? (
                <p className="ap-loading">Chargement...</p>
            ) : displayed.length === 0 ? (
                <p className="ap-empty">Aucun produit trouvé.</p>
            ) : (
                <div className="ap-list">
                    {displayed.map(p => (
                        <div className="ap-card" key={p.id}>
                            {/* Image — click opens gallery */}
                            <div className="ap-card-img" onClick={() => openGallery(p)}>
                                <img
                                    src={`${process.env.REACT_APP_API_URL}/uploads/${p.image_url}`}
                                    alt={p.title}
                                    onError={e => e.target.src = 'https://via.placeholder.com/120'}
                                />
                                <div className="ap-img-zoom">
                                    {p.gallery && p.gallery.length > 0 ? `🖼 +${p.gallery.length}` : '🔍'}
                                </div>
                            </div>

                            <div className="ap-card-body">
                                <div className="ap-card-top">
                                    <span className="ap-cat-tag">{p.category_name}</span>
                                    {Number(p.average_rating) > 0 && (
                                        <span className="ap-rating">★ {Number(p.average_rating).toFixed(1)}</span>
                                    )}
                                </div>
                                <h3 className="ap-card-title">{p.title}</h3>
                                {p.description && <p className="ap-card-desc">{p.description}</p>}

                                <div className="ap-card-details">
                                    {p.couleur && (
                                        <span className="ap-detail-tag">🎨 {p.couleur}</span>
                                    )}
                                    {(p.hauteur || p.largeur) && (
                                        <span className="ap-detail-tag">
                                            📐 {[p.hauteur && `H: ${p.hauteur}`, p.largeur && `L: ${p.largeur}`].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                </div>

                                <p className="ap-card-price">{convert(p.price)}</p>

                                <div className="ap-card-actions">
                                    <a
                                        href={whatsappLink(p.phone_number, p.title)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ap-whatsapp-btn"
                                        onClick={() => {
                                            const u = JSON.parse(localStorage.getItem('user'));
                                            axios.post(`${process.env.REACT_APP_API_URL}/api/products/${p.id}/visit`, {
                                                client_id: u ? u.id : null
                                            });
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L0 24l6.335-1.507A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.893 9.893 0 01-5.048-1.383l-.361-.214-3.762.895.952-3.671-.235-.374A9.878 9.878 0 012.107 12C2.107 6.58 6.58 2.107 12 2.107S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                                        </svg>
                                        WhatsApp
                                    </a>
                                    <button className="ap-rate-btn" onClick={() => openRating(p)}>
                                        ★ Noter
                                    </button>
                                    <button className="ap-comments-btn" onClick={e => openComments(e, p)}>
                                        💬 Avis
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Guest login ── */}
            {ratingModal && !user && (
                <div className="ap-modal-overlay" onClick={() => setRatingModal(null)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <button className="ap-modal-close" onClick={() => setRatingModal(null)}>✕</button>
                        <div className="ap-guest-msg">
                            <span className="ap-guest-icon">🔒</span>
                            <h3>Connexion requise</h3>
                            <p>Seuls les clients connectés peuvent noter un produit.</p>
                            <a href="/login" className="ap-login-link">Se connecter</a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rating modal ── */}
            {ratingModal && user?.role === 'client' && (
                <div className="ap-modal-overlay" onClick={() => setRatingModal(null)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <button className="ap-modal-close" onClick={() => setRatingModal(null)}>✕</button>
                        <h3 className="ap-modal-title">Noter ce produit</h3>
                        <p className="ap-modal-product">{ratingModal.title}</p>
                        <div className="ap-stars-row">
                            {[1,2,3,4,5].map(n => (
                                <span key={n}
                                    className={`ap-star ${n <= (hoverStar || stars) ? 'filled' : ''}`}
                                    onMouseEnter={() => setHoverStar(n)}
                                    onMouseLeave={() => setHoverStar(0)}
                                    onClick={() => setStars(n)}>★</span>
                            ))}
                        </div>
                        <p className="ap-stars-label">
                            {(hoverStar || stars) === 0 && 'Sélectionnez une note'}
                            {(hoverStar || stars) === 1 && 'Mauvais'}
                            {(hoverStar || stars) === 2 && 'Passable'}
                            {(hoverStar || stars) === 3 && 'Bien'}
                            {(hoverStar || stars) === 4 && 'Très bien'}
                            {(hoverStar || stars) === 5 && 'Excellent !'}
                        </p>
                        <textarea className="ap-comment-input"
                            placeholder="Laissez un commentaire (optionnel)..."
                            value={comment} onChange={e => setComment(e.target.value)} rows={3} />
                        {ratingMsg && <p className="ap-rating-msg">{ratingMsg}</p>}
                        <button className="ap-submit-rating" onClick={submitRating} disabled={submitting}>
                            {submitting ? 'Envoi...' : 'Envoyer mon avis'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Gallery Modal ── */}
            {galleryModal && (
                <div className="ap-modal-overlay" onClick={() => { setGalleryModal(null); setGalleryLightbox(null); }}>
                    <div className="ap-modal ap-gallery-modal" onClick={e => e.stopPropagation()}>
                        <button className="ap-modal-close" onClick={() => { setGalleryModal(null); setGalleryLightbox(null); }}>✕</button>
                        <h3 className="ap-modal-title">🖼 Galerie</h3>
                        <p className="ap-modal-product">{galleryModal.title}</p>

                        <div style={{ marginBottom: '14px' }}>
                            <p className="ap-gallery-section-label">Image principale</p>
                            <img
                                src={`${process.env.REACT_APP_API_URL}/uploads/${galleryModal.image_url}`}
                                alt="main"
                                className="ap-gallery-main-img"
                                onClick={() => setGalleryLightbox({
                                    url: `${process.env.REACT_APP_API_URL}/uploads/${galleryModal.image_url}`,
                                    type: 'image'
                                })}
                                onError={e => e.target.src = 'https://via.placeholder.com/400'}
                            />
                        </div>

                        <div className="ap-gallery-details">
                            <span className="ap-detail-tag">🎨 {galleryModal.couleur || 'Non spécifié'}</span>
                            <span className="ap-detail-tag">↕ H: {galleryModal.hauteur || 'Non spécifié'}</span>
                            <span className="ap-detail-tag">↔ L: {galleryModal.largeur || 'Non spécifié'}</span>
                        </div>

                        {galleryModal.gallery && galleryModal.gallery.length > 0 ? (
                            <>
                                <p className="ap-gallery-section-label" style={{ marginTop: '14px' }}>
                                    Galerie ({galleryModal.gallery.length} média{galleryModal.gallery.length > 1 ? 's' : ''})
                                </p>
                                <div className="ap-gallery-grid">
                                    {galleryModal.gallery.map(g => (
                                        <div key={g.id} className="ap-gallery-item"
                                            onClick={() => setGalleryLightbox({
                                                url: `${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`,
                                                type: g.file_type
                                            })}>
                                            {g.file_type === 'video'
                                                ? <video src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                    className="ap-gallery-thumb" muted />
                                                : <img src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                    alt="gallery" className="ap-gallery-thumb" />}
                                            <span className="ap-gallery-badge">
                                                {g.file_type === 'video' ? '🎥' : '🔍'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#ccc', fontSize: '13px', marginTop: '10px' }}>
                                Aucun média supplémentaire.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Gallery Lightbox ── */}
            {galleryLightbox && (
                <div className="ap-lightbox" onClick={() => setGalleryLightbox(null)}>
                    <button className="ap-lightbox-close" onClick={() => setGalleryLightbox(null)}>✕</button>
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

            {/* ── Comments Modal ── */}
            {commentsModal && (
                <div className="ap-modal-overlay" onClick={() => setCommentsModal(null)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <button className="ap-modal-close" onClick={() => setCommentsModal(null)}>✕</button>
                        <h3 className="ap-modal-title">💬 Avis clients</h3>
                        <p className="ap-modal-product">{commentsModal.title}</p>
                        {commentsModal.comments.length === 0 ? (
                            <p className="ap-comments-empty">Aucun avis pour ce produit.</p>
                        ) : (
                            <div className="ap-comments-list">
                                {commentsModal.comments.map((c, i) => (
                                    <div key={i} className="ap-comment-item">
                                        <div className="ap-comment-stars">
                                            {'★'.repeat(c.stars)}{'☆'.repeat(5 - c.stars)}
                                        </div>
                                        {c.comment && (
                                            <p className="ap-comment-text">{c.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArtisanProducts;