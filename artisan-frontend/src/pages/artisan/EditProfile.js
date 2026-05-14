import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './artisan_style/global_artisan.css';
import './artisan_style/editprofile.css';

function EditProfile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '', email: '', city: '', bio: '', phone_number: '', profile_picture: '', banner_photo: ''
    });
    
    const [selectedFile, setSelectedFile]       = useState(null);
    const [selectedBanner, setSelectedBanner]   = useState(null);
    const [previewUrl, setPreviewUrl]           = useState(null);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/artisan-login');
            return;
        }

        // Charger les infos actuelles
        axios.get(`http://localhost:5000/api/artisan/private/${user.id}`)
            .then(res => {
                setFormData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement:", err);
                setLoading(false);
            });
    }, [navigate]);

    // Gestion des champs texte
   const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
};

    // Gestion du fichier image profil
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    };

    // Gestion bannière
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedBanner(file); setBannerPreviewUrl(URL.createObjectURL(file)); }
    };
    // Gestion du changement de mot de passe
    const handlePasswordChange = async () => {
    const errs = {};
    if (!passwordData.current_password) errs.current_password = 'Champ obligatoire';
    if (!passwordData.new_password) errs.new_password = 'Champ obligatoire';
    if (passwordData.new_password !== passwordData.confirm_password)
        errs.confirm_password = 'Les mots de passe ne correspondent pas';
    if (passwordData.current_password === passwordData.new_password && passwordData.new_password)
        errs.new_password = 'Le nouveau mot de passe est identique à l\'ancien';
    if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return; }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        await axios.put(`http://localhost:5000/api/artisan/${user.id}/change-password`, {
            current_password: passwordData.current_password,
            new_password: passwordData.new_password
        });
        setPasswordSuccess('Mot de passe modifié avec succès !');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setPasswordErrors({});
        setShowPasswordForm(false);
    } catch (err) {
        const msg = err.response?.data?.error || 'Erreur serveur';
        if (msg.includes('incorrect')) setPasswordErrors({ current_password: 'Mot de passe actuel incorrect' });
        else if (msg.includes('identique')) setPasswordErrors({ new_password: 'Le nouveau mot de passe est identique à l\'ancien' });
        else setPasswordErrors({ current_password: msg });
    }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.full_name.trim()) newErrors.full_name = 'Le nom est obligatoire';
        if (!formData.email.trim()) newErrors.email = "L'email est obligatoire";
        if (!formData.phone_number?.trim()) newErrors.phone_number = 'Le téléphone est obligatoire';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            
            // On utilise FormData car il y a un fichier
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('email', formData.email);
            data.append('city', formData.city);
            data.append('bio', formData.bio);
            data.append('phone_number', formData.phone_number);
            
            if (selectedFile)   data.append('profile_picture', selectedFile);
            if (selectedBanner) data.append('banner_photo', selectedBanner);

            const response = await axios.put(
                `http://localhost:5000/api/update/${user.id}`, 
                data,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (response.data.success) {
                // Mise à jour locale pour que la sidebar soit synchro
                const updatedUser = { ...user, ...formData };
                if (response.data.newImagePath)  updatedUser.profile_picture = response.data.newImagePath;
                if (response.data.newBannerPath) updatedUser.banner_photo    = response.data.newBannerPath;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                alert("Profil mis à jour !");
                navigate('/artisan-profile');
            }
        } catch (err) {
            console.error("Erreur update:", err);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    if (loading) return <div className="artisan-main">Chargement...</div>;

    // Déterminer quelle image afficher (Aperçu neuf > Image actuelle > Par défaut)
    const currentImgDisplay = previewUrl || (formData.profile_picture?.startsWith('http') 
        ? formData.profile_picture 
        : `http://localhost:5000/uploads/${formData.profile_picture}`);

    return (
        <div className="artisan-dashboard">
            <aside className="artisan-sidebar">
                <div className="profile-img-frame">
                    <img src={currentImgDisplay} alt="Profil" />
                </div>
                <nav>
                    <div className="nav-item" onClick={() => navigate('/artisan-profile')}>👤 Mon Profil</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/products')}>📦 Mes Produits</div>
                    <div className="nav-item" onClick={() => navigate('/artisan/add-product')}>✨ Ajouter Produit</div>
                </nav>
            </aside>

            <main className="artisan-main">
                <div className="centered-form-wrapper">
                    <div className="info-card edit-container">
                        <h1 className="form-title">Modifier mon Profil</h1>
                        
                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-group">
                                <label>Nom Complet</label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                                style={{ borderColor: errors.full_name ? '#e74c3c' : '' }} />
                                {errors.full_name && <span style={{color:'#e74c3c', fontSize:'12px'}}>{errors.full_name}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{flex:1}}>
                                    <label>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                    style={{ borderColor: errors.email ? '#e74c3c' : '' }} />
                                    {errors.email && <span style={{color:'#e74c3c', fontSize:'12px'}}>{errors.email}</span>}
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Téléphone</label>
                                    <input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleChange}
                                     style={{ borderColor: errors.phone_number ? '#e74c3c' : '' }} />
                                    {errors.phone_number && <span style={{color:'#e74c3c', fontSize:'12px'}}>{errors.phone_number}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                        <label>Ville</label>
                        <select 
                            name="city" 
                            onChange={handleChange}
                            value={formData.city || ''}
                            required
                        >
                            <option value="" disabled>Sélectionnez votre ville</option>
                            <option value="Casablanca">Casablanca</option>
                            <option value="Rabat">Rabat</option>
                            <option value="Fès">Fès</option>
                            <option value="Marrakech">Marrakech</option>
                            <option value="Agadir">Agadir</option>
                            <option value="Tanger">Tanger</option>
                            <option value="Meknès">Meknès</option>
                            <option value="Oujda">Oujda</option>
                            <option value="Kénitra">Kénitra</option>
                            <option value="Tétouan">Tétouan</option>
                            <option value="Safi">Safi</option>
                            <option value="El Jadida">El Jadida</option>
                            <option value="Béni Mellal">Béni Mellal</option>
                            <option value="Nador">Nador</option>
                            <option value="Khouribga">Khouribga</option>
                            <option value="Settat">Settat</option>
                            <option value="Al Hoceïma">Al Hoceïma</option>
                            <option value="Essaouira">Essaouira</option>
                            <option value="Taza">Taza</option>
                            <option value="Guelmim">Guelmim</option>
                            <option value="Laayoune">Laayoune</option>
                            <option value="Dakhla">Dakhla</option>
                            <option value="Ifrane">Ifrane</option>
                            <option value="Chefchaouen">Chefchaouen</option>
                            <option value="Autre">Autre...</option>
                        </select>
                    </div>

                            <div className="form-group">
                                <label>Biographie</label>
                                <textarea name="bio" rows="4" value={formData.bio || ''} onChange={handleChange}></textarea>
                            </div>

                            <div className="form-group file-upload-section">
                                <label>📷 Changer la photo de profil</label>
                                {previewUrl && <img src={previewUrl} alt="aperçu profil" style={{width:'80px',height:'80px',borderRadius:'50%',objectFit:'cover',marginBottom:'8px'}} />}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                            </div>

                            <div className="form-group file-upload-section">
                                <label>🖼️ Changer la photo de bannière (profil public)</label>
                                {bannerPreviewUrl && <img src={bannerPreviewUrl} alt="aperçu bannière" style={{width:'100%',height:'100px',objectFit:'cover',borderRadius:'10px',marginBottom:'8px'}} />}
                                {!bannerPreviewUrl && formData.banner_photo && (
                                    <img src={`http://localhost:5000/uploads/${formData.banner_photo}`} alt="bannière actuelle" style={{width:'100%',height:'100px',objectFit:'cover',borderRadius:'10px',marginBottom:'8px'}} />
                                )}
                                <input type="file" accept="image/*" onChange={handleBannerChange} className="file-input" />
                                <small>Cette image apparaît en grand sur votre profil public.</small>
                            </div>

                            {/* PASSWORD SECTION */}
                            <div className="form-group">
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordErrors({}); setPasswordSuccess(''); }}
                                    style={{ background: 'none', border: '1px solid #b35935', color: '#b35935', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                >
                                    {showPasswordForm ? '✕ Annuler' : '🔒 Changer le mot de passe'}
                                </button>

                                {passwordSuccess && <p style={{ color: 'green', fontSize: '13px', marginTop: '8px' }}>{passwordSuccess}</p>}

                                {showPasswordForm && (
                                    <div style={{ marginTop: '16px', padding: '20px', background: '#fdfaf5', borderRadius: '12px', border: '1px solid #f0d4c0' }}>
                                        <div className="form-group">
                                            <label>Mot de passe actuel</label>
                                            <input
                                                type="password"
                                                value={passwordData.current_password}
                                                onChange={e => { setPasswordData({...passwordData, current_password: e.target.value}); setPasswordErrors({...passwordErrors, current_password: ''}); }}
                                                style={{ borderColor: passwordErrors.current_password ? '#e74c3c' : '' }}
                                            />
                                            {passwordErrors.current_password && <span style={{ color: '#e74c3c', fontSize: '12px' }}>{passwordErrors.current_password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label>Nouveau mot de passe</label>
                                            <input
                                                type="password"
                                                value={passwordData.new_password}
                                                onChange={e => { setPasswordData({...passwordData, new_password: e.target.value}); setPasswordErrors({...passwordErrors, new_password: ''}); }}
                                                style={{ borderColor: passwordErrors.new_password ? '#e74c3c' : '' }}
                                            />
                                            {passwordErrors.new_password && <span style={{ color: '#e74c3c', fontSize: '12px' }}>{passwordErrors.new_password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label>Confirmer le nouveau mot de passe</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirm_password}
                                                onChange={e => { setPasswordData({...passwordData, confirm_password: e.target.value}); setPasswordErrors({...passwordErrors, confirm_password: ''}); }}
                                                style={{ borderColor: passwordErrors.confirm_password ? '#e74c3c' : '' }}
                                            />
                                            {passwordErrors.confirm_password && <span style={{ color: '#e74c3c', fontSize: '12px' }}>{passwordErrors.confirm_password}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handlePasswordChange}
                                            style={{ background: '#b35935', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                                        >
                                            CONFIRMER LE CHANGEMENT
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="profile-actions" style={{marginTop: '20px'}}>
                                <button type="submit" className="btn-submit">SAUVEGARDER</button>
                                <button type="button" className="btn-delete-account" onClick={() => navigate('/artisan-profile')}>ANNULER</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default EditProfile;