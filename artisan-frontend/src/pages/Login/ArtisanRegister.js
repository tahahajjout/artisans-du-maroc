import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ArtisanRegister.css";

const CITIES = [
  "Casablanca",
  "Rabat",
  "Fès",
  "Marrakech",
  "Agadir",
  "Tanger",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan",
  "Safi",
  "El Jadida",
  "Béni Mellal",
  "Nador",
  "Khouribga",
  "Settat",
  "Al Hoceïma",
  "Essaouira",
  "Taza",
  "Guelmim",
  "Laayoune",
  "Dakhla",
  "Ifrane",
  "Chefchaouen",
  "Autre...",
];

function ArtisanRegister() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    bio: "",
    city: "",
    phone_number: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [bannerPhoto, setBannerPhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProfileFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setProfilePicture(f);
      setProfilePreview(URL.createObjectURL(f));
    }
  };

  const handleBannerFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setBannerPhoto(f);
      setBannerPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.city) {
      setError("Veuillez sélectionner votre ville.");
      return;
    }

    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);
    if (profilePicture) data.append("profile_picture", profilePicture);
    if (bannerPhoto) data.append("banner_photo", bannerPhoto);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/register-artisan`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (response.data.success) navigate("/artisan-space");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ borderTop: "5px solid #b95d2b" }}>
        <h2>Rejoindre les Artisans</h2>
        <p className="auth-subtitle">Créez votre vitrine professionnelle</p>

        {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet / Nom d'atelier</label>
            <input
              type="text"
              name="full_name"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group half">
              <label>Téléphone</label>
              <input type="text" name="phone_number" onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Ville <span style={{ color: "red" }}>*</span>
            </label>
            <select
              name="city"
              onChange={handleChange}
              value={formData.city}
              required
            >
              <option value="" disabled>
                Sélectionnez votre ville
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Bio (Votre histoire, votre savoir-faire)</label>
            <textarea name="bio" rows="3" onChange={handleChange}></textarea>
          </div>

          <div className="register-photos-row">
            <div className="register-photo-box">
              <label>📷 Photo de profil</label>
              <div className="register-img-preview profile-preview">
                {profilePreview ? (
                  <img src={profilePreview} alt="profil" />
                ) : (
                  <span>Aucune image</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileFile}
              />
            </div>

            <div className="register-photo-box">
              <label>🖼️ Photo de bannière (profil public)</label>
              <div className="register-img-preview banner-preview">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="bannière" />
                ) : (
                  <span>Aucune image</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleBannerFile} />
            </div>
          </div>

          <button
            type="button"
            className="btn-preview-profile"
            onClick={() => setShowPreview(true)}
          >
            👁️ Aperçu du profil public
          </button>

          <button type="submit" className="auth-btn">
            CRÉER MON COMPTE
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/artisan-space">Déjà un compte ? Se connecter</Link>
        </div>
      </div>

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="preview-close"
              onClick={() => setShowPreview(false)}
            >
              ✕
            </button>
            <p className="preview-label">Aperçu de votre profil public</p>

            <div className="prev-hero">
              <div className="prev-banner">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="bannière" />
                ) : (
                  <div className="prev-banner-placeholder">Bannière</div>
                )}
              </div>
              <div className="prev-avatar">
                {profilePreview ? (
                  <img src={profilePreview} alt="profil" />
                ) : (
                  <div className="prev-avatar-placeholder">Photo</div>
                )}
              </div>
            </div>

            <div className="prev-body">
              <h2>{formData.full_name || "Votre Nom"}</h2>
              <p className="prev-city">📍 {formData.city || "Votre ville"}</p>
              <div className="prev-bio">
                <p>{formData.bio || "Votre biographie apparaîtra ici."}</p>
              </div>
              <div className="prev-actions">
                <span className="prev-btn-contact">📞 CONTACTER</span>
                <span className="prev-btn-products">🛍️ PRODUITS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtisanRegister;
