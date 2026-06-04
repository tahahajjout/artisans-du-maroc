import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../components/CurrencyContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import Footer from '../../components/Footer';
import logoImg from '../../logo.png';

const categoryImages = {
    'tapis': 'https://images.unsplash.com/photo-1576016770956-debb63d92058?auto=format&fit=crop&q=80&w=400',
    'céramique': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400',
    'cuir': 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=400',
    'bijoux': 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=400'
};

function Home() {
    const [categories, setCategories]     = useState([]);
    const [artisans, setArtisans]         = useState([]);
    const [isMenuOpen, setIsMenuOpen]     = useState(false);
    const [user, setUser]                 = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Recommendations
    const [recommendations, setRecommendations] = useState([]);
    const [recoType, setRecoType]               = useState('general');
    const [recoIndex, setRecoIndex]             = useState(0);

    // Reco product popup
    const [recoPopup, setRecoPopup]       = useState(null);
    const [recoLightbox, setRecoLightbox] = useState(null);

    // Search
    const [searchTerm, setSearchTerm]       = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching]         = useState(false);
    const [showResults, setShowResults]     = useState(false);

    const navigate = useNavigate();
    const { convert } = useCurrency();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        if (parsedUser) setUser(parsedUser);

        const fetchData = async () => {
            try {
                const catRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
                setCategories(catRes.data);

                const artRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/top-by-city`);
                setArtisans(artRes.data);

                const clientId = parsedUser ? parsedUser.id : 'guest';
                const recoRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/products/recommendations/${clientId}`);
                setRecommendations(recoRes.data.products || []);
                setRecoType(recoRes.data.type || 'general');
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async (e) => {
        if (e.key !== 'Enter' && e.type !== 'click') return;
        if (!searchTerm.trim()) return;
        setSearching(true);
        setShowResults(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/search?q=${encodeURIComponent(searchTerm)}`);
            setSearchResults(res.data);
        } catch {
            setSearchResults({ artisans: [], products: [] });
        } finally {
            setSearching(false);
        }
    };

    const closeResults  = () => { setShowResults(false); setSearchResults(null); setSearchTerm(''); };
    const nextSlide     = () => { if (currentIndex + 4 < artisans.length) setCurrentIndex(currentIndex + 4); };
    const prevSlide     = () => { if (currentIndex - 4 >= 0) setCurrentIndex(currentIndex - 4); };
    const nextRecoSlide = () => { if (recoIndex + 4 < recommendations.length) setRecoIndex(recoIndex + 4); };
    const prevRecoSlide = () => { if (recoIndex - 4 >= 0) setRecoIndex(recoIndex - 4); };

    const trackVisit = (productId) => {
        axios.post(`${process.env.REACT_APP_API_URL}/api/products/${productId}/visit`, {
            client_id: user ? user.id : null
        });
    };

    const openRecoPopup = (e, p) => {
        e.stopPropagation();
        trackVisit(p.id);
        setRecoPopup(p);
        setRecoLightbox(null);
    };

    const closeRecoPopup = () => { setRecoPopup(null); setRecoLightbox(null); };

    const noResults = searchResults && searchResults.artisans.length === 0 && searchResults.products.length === 0;

    return (
        <div className="App">
            <header className="header-main">
                <img src={logoImg} alt="Logo Artisans du Maroc" className="header-logo-img" />  
                <h1 className="logo">ARTISANS DU MAROC</h1>
                <div className="menu-wrap">
                    <span className="status-badge">{user ? user.full_name.toUpperCase() : 'VISITEUR'}</span>
                    <button className="menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
                    {isMenuOpen && (
                        <div className="dropdown-menu">
                            {user ? (
                                <div className="menu-item" onClick={() => { localStorage.removeItem('user'); window.location.reload(); }}>🚪 Déconnexion</div>
                            ) : (
                                <Link to="/login" className="menu-item">🔑 Connexion Client</Link>
                            )}
                            <Link to="/artisan-space" className="menu-item">🛠️ Espace Artisan</Link>
                            <Link to="/admin/login" className="menu-item admin-item">⚙️ Admin</Link>
                        </div>
                    )}
                </div>
            </header>

            {/* ── Search ── */}
            <div className="search-container">
                <div className="search-bar">
                    <input className="search-input" type="text"
                        placeholder="Rechercher un artisan ou un produit..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch} />
                    <button className="search-btn" onClick={handleSearch}>🔍</button>
                </div>
            </div>

            {/* ── Search Results Popup ── */}
            {showResults && (
                <div className="search-overlay" onClick={closeResults}>
                    <div className="search-popup" onClick={e => e.stopPropagation()}>
                        <div className="search-popup-header">
                            <span>Résultats pour « {searchTerm} »</span>
                            <button className="search-close" onClick={closeResults}>✕</button>
                        </div>
                        {searching && <p className="search-status">Recherche en cours...</p>}
                        {!searching && noResults && (
                            <p className="search-status search-empty">
                                Aucun artisan ou produit correspondant à « {searchTerm} »
                            </p>
                        )}
                        {!searching && searchResults && searchResults.artisans.length > 0 && (
                            <div className="search-section">
                                <h4 className="search-section-title">Artisans</h4>
                                {searchResults.artisans.map(a => (
                                    <div className="search-artisan-card" key={a.id}>
                                        <img
                                            src={a.profile_picture?.startsWith('http') ? a.profile_picture : `${process.env.REACT_APP_API_URL}/uploads/${a.profile_picture}`}
                                            alt={a.full_name}
                                            onError={e => e.target.src = 'https://via.placeholder.com/60'} />
                                        <div className="search-artisan-info">
                                            <strong>{a.full_name}</strong>
                                            <span>📍 {a.city}</span>
                                        </div>
                                        <button className="search-profile-btn"
                                            onClick={() => { navigate(`/artisan/${a.id}`); closeResults(); }}>
                                            Voir profil →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!searching && searchResults && searchResults.products.length > 0 && (
                            <div className="search-section">
                                <h4 className="search-section-title">Produits</h4>
                                {searchResults.products.map(p => (
                                    <div className="search-product-card" key={p.id}>
                                        <img src={`${process.env.REACT_APP_API_URL}/uploads/${p.image_url}`} alt={p.title}
                                            onError={e => e.target.src = 'https://via.placeholder.com/80'} />
                                        <div className="search-product-info">
                                            <strong>{p.title}</strong>
                                            <span className="search-price">{convert(p.price)}</span>
                                            <span className="search-artisan-tag">🧑‍🎨 {p.artisan_name}</span>
                                        </div>
                                        <button className="search-profile-btn"
                                            onClick={() => { navigate(`/artisan/${p.artisan_id}`); closeResults(); }}>
                                            Contacter →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Categories ── */}
            <section className="home-section">
                <h2>DÉCOUVRIR PAR CATÉGORIE</h2>
                <div className="category-grid">
                    {categories.map(cat => {
                        const imgUrl = categoryImages[cat.name.toLowerCase()] || 'https://via.placeholder.com/400';
                        return (
                            <Link key={cat.id} to={`/category/${cat.name}`} className="category-card">
                                <img src={imgUrl} alt={cat.name} className="category-img" />
                                <div className="category-name">{cat.name.toUpperCase()}</div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ── Recommendations ── */}
            {recommendations.length > 0 && (
                <section className="home-section">
                    <h2>{recoType === 'personalized' ? 'RECOMMANDÉ POUR VOUS' : 'PRODUITS POPULAIRES'}</h2>
                    <div className="slider-container">
                        <button className="slider-arrow left" onClick={prevRecoSlide} disabled={recoIndex === 0}>‹</button>
                        <div className="artisans-grid">
                            {recommendations.slice(recoIndex, recoIndex + 4).map(p => (
                                <div key={p.id} className="reco-card"
                                    onClick={() => { trackVisit(p.id); navigate(`/artisan/${p.artisan_id}/products`); }}>
                                    <div className="rating-tag">★ {Number(p.average_rating || 0).toFixed(1)}</div>
                                    <img className="artisan-img"
                                        src={`${process.env.REACT_APP_API_URL}/uploads/${p.image_url}`}
                                        alt={p.title}
                                        onError={e => e.target.src = 'https://via.placeholder.com/400'} />
                                    <div className="artisan-info">
                                        <h3>{p.title}</h3>
                                        <p className="city-tag" style={{ color: '#b85c28', fontWeight: '700' }}>
                                            {convert(p.price)}
                                        </p>
                                        <p className="city-tag">🧑‍🎨 {p.artisan_name}</p>
                                        <button className="reco-info-btn" onClick={e => openRecoPopup(e, p)}>
                                            + Plus d'infos
                                        </button>
                                        {p.phone_number && (
                                            <a href={`https://wa.me/${p.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre produit: ${p.title}`)}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="reco-whatsapp-btn"
                                                onClick={e => { e.stopPropagation(); trackVisit(p.id); }}>
                                                Commander via WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="slider-arrow right" onClick={nextRecoSlide} disabled={recoIndex + 4 >= recommendations.length}>›</button>
                    </div>
                </section>
            )}

            {/* ── Artisans Vedettes ── */}
            <section className="home-section">
                <h2>ARTISANS VEDETTES</h2>
                <div className="slider-container">
                    <button className="slider-arrow left" onClick={prevSlide} disabled={currentIndex === 0}>‹</button>
                    <div className="artisans-grid">
                        {artisans.slice(currentIndex, currentIndex + 4).map(art => {
                            const artisanImg = art.profile_picture?.startsWith('http')
                                ? art.profile_picture
                                : `${process.env.REACT_APP_API_URL}/uploads/${art.profile_picture}`;
                            return (
                                <Link to={`/artisan/${art.id}`} key={art.id} className="artisan-card">
                                    <div className="rating-tag">★ {Number(art.average_rating || 0).toFixed(1)}</div>
                                    <img className="artisan-img" src={artisanImg} alt={art.full_name}
                                        onError={e => e.target.src = 'https://via.placeholder.com/400'} />
                                    <div className="artisan-info">
                                        <h3>{art.full_name}</h3>
                                        <p className="city-tag">📍 {art.city}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <button className="slider-arrow right" onClick={nextSlide} disabled={currentIndex + 4 >= artisans.length}>›</button>
                </div>
            </section>

            <Footer />

            {/* ── Reco Product Popup ── */}
            {recoPopup && (
                <div className="reco-overlay" onClick={closeRecoPopup}>
                    <div className="reco-popup" onClick={e => e.stopPropagation()}>
                        <button className="reco-popup-close" onClick={closeRecoPopup}>✕</button>

                        <img
                            src={`${process.env.REACT_APP_API_URL}/uploads/${recoPopup.image_url}`}
                            alt={recoPopup.title}
                            className="reco-popup-img"
                            style={{ cursor: 'zoom-in' }}
                            onClick={() => setRecoLightbox({
                                url: `${process.env.REACT_APP_API_URL}/uploads/${recoPopup.image_url}`,
                                type: 'image'
                            })}
                            onError={e => e.target.src = 'https://via.placeholder.com/400'}
                        />

                        <div className="reco-popup-body">
                            <h2 className="reco-popup-title">{recoPopup.title}</h2>
                            <p className="reco-popup-price">{convert(recoPopup.price)}</p>

                            <div className="reco-popup-specs">
                                <span className="reco-spec-tag">🎨 {recoPopup.couleur || 'Non spécifié'}</span>
                                <span className="reco-spec-tag">↕ H: {recoPopup.hauteur || 'Non spécifié'}</span>
                                <span className="reco-spec-tag">↔ L: {recoPopup.largeur || 'Non spécifié'}</span>
                            </div>

                            {recoPopup.description && (
                                <p className="reco-popup-desc">{recoPopup.description}</p>
                            )}

                            {recoPopup.gallery && recoPopup.gallery.length > 0 && (
                                <div className="reco-popup-gallery">
                                    <p className="reco-popup-gallery-label">
                                        Galerie ({recoPopup.gallery.length})
                                    </p>
                                    <div className="reco-popup-gallery-grid">
                                        {recoPopup.gallery.map(g => (
                                            <div key={g.id} className="reco-popup-gallery-item"
                                                onClick={() => setRecoLightbox({
                                                    url: `${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`,
                                                    type: g.file_type
                                                })}>
                                                {g.file_type === 'video'
                                                    ? <video src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                        className="reco-popup-gallery-thumb" muted />
                                                    : <img src={`${process.env.REACT_APP_API_URL}/uploads/${g.file_url}`}
                                                        alt="gallery" className="reco-popup-gallery-thumb" />}
                                                <span className="reco-popup-gallery-badge">
                                                    {g.file_type === 'video' ? '🎥' : '🔍'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="reco-popup-artisan-name">🧑‍🎨 {recoPopup.artisan_name}</p>
                            {recoPopup.comments && recoPopup.comments.length > 0 && (
                            <div className="reco-popup-reviews">
                                <p className="reco-popup-reviews-title">
                                    Avis clients ({recoPopup.comments.length})
                                </p>
                                {recoPopup.comments.map((c, i) => (
                                    <div key={i} className="reco-review-item">
                                        <div className="reco-review-stars">
                                            {'★'.repeat(c.stars)}{'☆'.repeat(5 - c.stars)}
                                        </div>
                                        {c.comment && (
                                            <p className="reco-review-comment">{c.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                            <button className="reco-popup-contact"
                                onClick={() => { closeRecoPopup(); navigate(`/artisan/${recoPopup.artisan_id}/products`); }}>
                                Voir tous les produits →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reco Lightbox ── */}
            {recoLightbox && (
                <div className="reco-lightbox" onClick={() => setRecoLightbox(null)}>
                    <button className="reco-lightbox-close" onClick={() => setRecoLightbox(null)}>✕</button>
                    {recoLightbox.type === 'video'
                        ? <video src={recoLightbox.url} controls autoPlay
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px' }} />
                        : <img src={recoLightbox.url} alt="preview"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
                    }
                </div>
            )}
        </div>
    );
}

export default Home;