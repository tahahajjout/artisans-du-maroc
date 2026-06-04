import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ArtisanPublicProfile.css';

function ArtisanPublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/artisan/${id}`)
            .then(res => setArtisan(res.data))
            .catch(err => console.error("Erreur de récupération:", err));
    }, [id]);

    if (!artisan) return <div className="loading">Chargement...</div>;

    // Gestion des images dynamiques
    const profileImg = artisan.profile_picture?.startsWith('http') 
        ? artisan.profile_picture 
        : `${process.env.REACT_APP_API_URL}/uploads/${artisan.profile_picture}`;

    // On utilise la photo de profil en bannière si banner_photo n'existe pas
    const bannerImg = artisan.banner_photo 
        ? (artisan.banner_photo.startsWith('http') ? artisan.banner_photo : `${process.env.REACT_APP_API_URL}/uploads/${artisan.banner_photo}`)
        : profileImg;

    return (
        <div className="public-profile-container">
            {/* Barre de navigation */}
            <header className="profile-top-nav">
                <button onClick={() => navigate('/')} className="back-arrow">←</button>
                <h1>PROFIL ARTISAN</h1>
                <div style={{ width: '40px' }}></div>
            </header>

            {/* Section Visuelle avec Superposition */}
            <div className="hero-block">
                <div className="banner-frame">
                    <img src={bannerImg} alt="Bannière" className="banner-photo" />
                </div>
                <div className="avatar-overlap">
                    <img 
                        src={profileImg} 
                        alt={artisan.full_name} 
                        className="avatar-photo" 
                        onError={(e) => e.target.src='https://via.placeholder.com/150'}
                    />
                </div>
            </div>

            {/* Informations de l'artisan */}
            <div className="profile-details">
                <h2 className="artisan-name">{artisan.full_name}</h2>
                <p className="artisan-location">📍 {artisan.city}</p>
                
                <div className="bio-bubble">
                    <p>{artisan.bio || "Bienvenue dans mon univers artisanal. Chaque pièce est unique."}</p>
                </div>

                {/* Actions */}
                <div className="profile-actions-row">
                    <a 
                        href={`https://wa.me/${
                            artisan.phone_number
                                ?.replace(/\s/g, '')
                                .replace(/^0/, '212')  // 0612... → 212612... (Morocco)
                        }`}
                        className="action-btn contact-btn"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        📞 CONTACTER
                    </a>
                    <button 
                        onClick={() => navigate(`/artisan/${id}/products`)} 
                        className="action-btn products-btn"
                    >
                        🛍️ PRODUITS
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ArtisanPublicProfile;