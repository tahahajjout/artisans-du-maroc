import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './artisan_style/global_artisan.css';
import './artisan_style/add.css';

function AddProduct() {
    const navigate = useNavigate();

    const [title, setTitle]             = useState('');
    const [price, setPrice]             = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId]   = useState('');
    const [hauteur, setHauteur]         = useState('');
    const [largeur, setLargeur]         = useState('');
    const [couleur, setCouleur]         = useState('');
    const [matiere , setmatiere ]       = useState('');
    const [imageFile, setImageFile]     = useState(null);
    const [preview, setPreview]         = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [priceError, setPriceError]   = useState('');
    const [galleryLightbox, setGalleryLightbox] = useState(null);

    const [categories, setCategories]   = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/categories`)
            .then(res => setCategories(res.data))
            .catch(err => console.error("Erreur catégories:", err));
    }, []);

    const sidebarImg = user?.profile_picture?.startsWith('http')
        ? user.profile_picture
        : `${process.env.REACT_APP_API_URL}/uploads/${user?.profile_picture}`;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        const newItems = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setGalleryFiles(prev => [...prev, ...newItems]);
        e.target.value = '';
    };

    const removeGalleryItem = (index) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handlePriceChange = (e) => {
        const val = e.target.value;
        setPrice(val);
        setPriceError(Number(val) < 0 ? 'Prix < 0 impossible' : '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.id) { alert("Erreur: Artisan non identifié."); return; }
        if (Number(price) < 0) { setPriceError('Prix < 0 impossible'); return; }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('category_id', categoryId);
        formData.append('artisan_id', user.id);
        formData.append('image', imageFile);
        if (hauteur) formData.append('hauteur', hauteur);
        if (largeur) formData.append('largeur', largeur);
        if (couleur) formData.append('couleur', couleur);
        if (matiere ) formData.append('matiere ', matiere );
        galleryFiles.forEach(item => formData.append('gallery', item.file));

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products/add`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.status === 201) {
                alert("Produit ajouté avec succès !");
                navigate('/artisan/products');
            }
        } catch (error) {
            console.error("Erreur lors de l'ajout:", error);
            alert(error.response?.data?.message || "Erreur lors de la publication.");
        }
    };

    return (
        <div className="artisan-dashboard">
            <aside className="artisan-sidebar">
                <div className="profile-img-frame">
                    <img src={sidebarImg} alt="Profil"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/110'} />
                </div>
                <nav>
                    <div className="nav-item" onClick={() => navigate('/artisan-profile')}>👤 Mon Profil</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/products')}>📦 Mes Produits</div>
                    <div className="nav-item active">✨ Ajouter Produit</div>
                </nav>
            </aside>

            <main className="artisan-main">
                <div className="artisan-card">
                    <h2 style={{ textAlign: 'center', color: '#b35935', marginBottom: '30px' }}>
                        Ajouter une nouvelle création
                    </h2>

                    <form onSubmit={handleSubmit}>

                        {/* ── Image principale ── */}
                        <label className="info-label">Image principale *</label>
                        <div className="upload-section" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div className="upload-preview"
                                onClick={() => document.getElementById('fileInput').click()}
                                style={{ cursor: 'pointer' }}>
                                {preview
                                    ? <img src={preview} alt="preview" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                                    : <p style={{ color: '#999' }}>📸 Cliquez pour sélectionner une image *</p>}
                            </div>
                            <input id="fileInput" type="file" accept="image/*"
                                onChange={handleFileChange} style={{ display: 'none' }} required />
                        </div>

                        {/* ── Titre ── */}
                        <label className="info-label">Nom du produit *</label>
                        <input type="text" className="art-input" placeholder="Ex: Tajine décoratif"
                            value={title} onChange={(e) => setTitle(e.target.value)} required />

                        {/* ── Description ── */}
                        <label className="info-label">Description</label>
                        <textarea className="art-input" rows="3" value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez votre création..." />

                        {/* ── Prix & Catégorie ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Prix (DH) *
                                    {priceError && <span style={{ color: '#e74c3c', fontSize: '12px', fontWeight: '600' }}>⚠ {priceError}</span>}
                                </label>
                                <input type="number" className="art-input" value={price}
                                    onChange={handlePriceChange}
                                    style={{ borderColor: priceError ? '#e74c3c' : '' }} required />
                            </div>
                            <div>
                                <label className="info-label">Catégorie *</label>
                                <select className="art-input" value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)} required>
                                    <option value="">Sélectionner</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Couleur ── */}
                        <label className="info-label">Couleur</label>
                        <input type="text" className="art-input"
                            placeholder="Ex: Rouge, Beige, Multicolore..."
                            value={couleur} onChange={(e) => setCouleur(e.target.value)} />
                         <label className="info-label">Matériel</label>


                         {/* ── Matériel ── */}
                        <input type="text" className="art-input"
                             placeholder="Ex: Argile, Laine, Cuir, Bois..."
                             value={matiere } onChange={(e) => setmatiere (e.target.value)} />

                        {/* ── Dimensions ── */}
                        <label className="info-label">Dimensions</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <input type="text" className="art-input" placeholder="Hauteur (ex: 30 cm)"
                                value={hauteur} onChange={(e) => setHauteur(e.target.value)} />
                            <input type="text" className="art-input" placeholder="Largeur (ex: 20 cm)"
                                value={largeur} onChange={(e) => setLargeur(e.target.value)} />
                        </div>

                        {/* ── Galerie ── */}
                        <label className="info-label" style={{ marginTop: '16px' }}>
                            Galerie (photos & vidéos supplémentaires)
                        </label>
                        <div className="gallery-upload-zone"
                            onClick={() => document.getElementById('galleryInput').click()}>
                            <p>📁 Cliquez pour ajouter des photos ou vidéos</p>
                            <span style={{ fontSize: '12px', color: '#aaa' }}>JPG, PNG, MP4, MOV...</span>
                        </div>
                        <input id="galleryInput" type="file" accept="image/*,video/*" multiple
                            onChange={handleGalleryChange} style={{ display: 'none' }} />

                        {galleryFiles.length > 0 && (
                            <div className="gallery-preview-grid">
                                {galleryFiles.map((item, i) => (
                                    <div key={i} className="gallery-preview-item"
                                        onClick={() => setGalleryLightbox({ url: item.previewUrl, type: item.type })}>
                                        {item.type === 'video'
                                            ? <video src={item.previewUrl} className="gallery-thumb" muted />
                                            : <img src={item.previewUrl} alt={`gallery-${i}`} className="gallery-thumb" />}
                                        <button type="button" className="gallery-remove-btn"
                                            onClick={e => { e.stopPropagation(); removeGalleryItem(i); }}>✕</button>
                                        <span className="gallery-type-badge">
                                            {item.type === 'video' ? '🎥' : '🔍'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Submit ── */}
                        <button type="submit" className="btn-publish"
                            style={{ width: '100%', padding: '15px', background: '#b35935', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                                fontSize: '16px', marginTop: '20px' }}>
                            PUBLIER LE PRODUIT
                        </button>
                    </form>
                </div>
            </main>

            {/* ── Gallery Lightbox ── */}
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

export default AddProduct;