import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './artisan_style/edit_product.css';

function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile]       = useState(null);
    const [preview, setPreview]                 = useState(null);
    const [categories, setCategories]           = useState([]);
    const [existingGallery, setExistingGallery] = useState([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState([]);
    const [deletedGalleryIds, setDeletedGalleryIds] = useState([]);
    const [galleryLightbox, setGalleryLightbox] = useState(null);
    const [formData, setFormData] = useState({
        title: '', price: '', description: '',
        category_id: '', hauteur: '', largeur: '', couleur: ''
    });

    useEffect(() => {
        axios.get('http://localhost:5000/api/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error(err));

        axios.get(`http://localhost:5000/api/products/${id}`)
            .then(res => {
                const p = res.data;
                setFormData({
                    title: p.title || '',
                    price: p.price || '',
                    description: p.description || '',
                    category_id: p.category_id || '',
                    hauteur: p.hauteur || '',
                    largeur: p.largeur || '',
                    couleur: p.couleur || ''
                });
                setPreview(`http://localhost:5000/uploads/${p.image_url}`);
                setExistingGallery(p.gallery || []);
            })
            .catch(err => console.error(err));
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); setPreview(URL.createObjectURL(file)); }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        const newItems = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setNewGalleryFiles(prev => [...prev, ...newItems]);
        e.target.value = '';
    };

    const removeExistingGallery = (galleryId) => {
        setDeletedGalleryIds(prev => [...prev, galleryId]);
        setExistingGallery(prev => prev.filter(g => g.id !== galleryId));
    };

    const removeNewGallery = (index) => {
        setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Number(formData.price) < 0) return;

        const data = new FormData();
        data.append('title', formData.title);
        data.append('price', formData.price);
        data.append('description', formData.description);
        data.append('category_id', formData.category_id);
        data.append('hauteur', formData.hauteur);
        data.append('largeur', formData.largeur);
        data.append('couleur', formData.couleur);
        if (selectedFile) data.append('image', selectedFile);
        newGalleryFiles.forEach(item => data.append('gallery', item.file));
        if (deletedGalleryIds.length > 0)
            data.append('deletedGalleryIds', JSON.stringify(deletedGalleryIds));

        try {
            await axios.put(`http://localhost:5000/api/products/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Produit mis à jour !");
            navigate('/artisan/products');
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la mise à jour");
        }
    };

    return (
        <div className="artisan-dashboard">
            <main className="edit-main">
                <div className="content-card">
                    <h2 className="page-title">Modifier votre Création</h2>

                    <form onSubmit={handleSubmit}>

                        {/* ── Image principale ── */}
                        <div className="image-edit-section">
                            <div className="image-preview-wrapper">
                                <img src={preview} alt="Aperçu produit" />
                            </div>
                            <input type="file" accept="image/*" onChange={handleFileChange}
                                className="file-input-custom" />
                            <small style={{ color: '#7f8c8d' }}>Cliquez pour changer l'image principale</small>
                        </div>

                        {/* ── Titre ── */}
                        <div className="input-group">
                            <label>Nom du produit</label>
                            <input type="text" value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                        </div>

                        {/* ── Prix & Catégorie ── */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Prix (DH)
                                    {Number(formData.price) < 0 && (
                                        <span style={{ color: '#e74c3c', fontSize: '12px', fontWeight: '600' }}>
                                            ⚠ Prix &lt; 0 impossible
                                        </span>
                                    )}
                                </label>
                                <input type="number" value={formData.price} required min="0"
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    style={{
                                        borderColor: Number(formData.price) < 0 ? '#e74c3c' : '',
                                        outline: Number(formData.price) < 0 ? '2px solid #e74c3c' : ''
                                    }} />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Catégorie</label>
                                <select value={formData.category_id} required
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                    <option value="">Sélectionner...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Description ── */}
                        <div className="input-group">
                            <label>Description</label>
                            <textarea rows="4" value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        {/* ── Couleur ── */}
                        <div className="input-group">
                            <label>Couleur</label>
                            <input type="text" placeholder="Ex: Rouge, Beige, Multicolore..."
                                value={formData.couleur}
                                onChange={e => setFormData({ ...formData, couleur: e.target.value })} />
                        </div>

                        {/* ── Dimensions ── */}
                        <div className="input-group">
                            <label>Dimensions</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <input type="text" placeholder="Hauteur (ex: 30 cm)"
                                    value={formData.hauteur} style={{ flex: 1 }}
                                    onChange={e => setFormData({ ...formData, hauteur: e.target.value })} />
                                <input type="text" placeholder="Largeur (ex: 20 cm)"
                                    value={formData.largeur} style={{ flex: 1 }}
                                    onChange={e => setFormData({ ...formData, largeur: e.target.value })} />
                            </div>
                        </div>

                        {/* ── Galerie existante ── */}
                        {existingGallery.length > 0 && (
                            <div className="input-group">
                                <label>Galerie actuelle</label>
                                <div className="gallery-preview-grid">
                                    {existingGallery.map(g => (
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
                                            <button type="button" className="gallery-remove-btn"
                                                onClick={e => { e.stopPropagation(); removeExistingGallery(g.id); }}>
                                                ✕
                                            </button>
                                            <span className="gallery-type-badge">
                                                {g.file_type === 'video' ? '🎥' : '🔍'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Ajouter à la galerie ── */}
                        <div className="input-group">
                            <label>Ajouter à la galerie</label>
                            <div className="gallery-upload-zone"
                                onClick={() => document.getElementById('galleryInputEdit').click()}>
                                <p>📁 Cliquez pour ajouter des photos ou vidéos</p>
                                <span style={{ fontSize: '12px', color: '#aaa' }}>JPG, PNG, MP4, MOV...</span>
                            </div>
                            <input id="galleryInputEdit" type="file" accept="image/*,video/*" multiple
                                onChange={handleGalleryChange} style={{ display: 'none' }} />

                            {newGalleryFiles.length > 0 && (
                                <div className="gallery-preview-grid" style={{ marginTop: '10px' }}>
                                    {newGalleryFiles.map((item, i) => (
                                        <div key={i} className="gallery-preview-item"
                                            onClick={() => setGalleryLightbox({ url: item.previewUrl, type: item.type })}>
                                            {item.type === 'video'
                                                ? <video src={item.previewUrl} className="gallery-thumb" muted />
                                                : <img src={item.previewUrl} alt={`new-${i}`} className="gallery-thumb" />}
                                            <button type="button" className="gallery-remove-btn"
                                                onClick={e => { e.stopPropagation(); removeNewGallery(i); }}>
                                                ✕
                                            </button>
                                            <span className="gallery-type-badge">
                                                {item.type === 'video' ? '🎥' : '🔍'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Actions ── */}
                        <div className="actions-row">
                            <button type="submit" className="btn-main">ENREGISTRER LES MODIFICATIONS</button>
                            <button type="button" className="btn-secondary"
                                onClick={() => navigate('/artisan/products')}>
                                ANNULER
                            </button>
                        </div>
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

export default EditProduct;