import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auth.css'; 

function RegisterClient() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: ''
    });
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Envoi des données au serveur
            const res = await axios.post('http://localhost:5000/api/auth/register-client', formData);  
            
            // Si succès : On enregistre les infos de l'utilisateur dans le navigateur
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Redirection immédiate vers la Home
            navigate('/'); 
            
        } catch (err) {
            // Si le serveur renvoie une erreur 400 (Compte existe déjà ou champ manquant)
            if (err.response && err.response.status === 400) {
                alert(err.response.data.message); // Affiche "ce compte existe deja"
            } else {
                alert("Une erreur technique est survenue.");
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Inscription Client</h2>
                <p>Créez votre compte pour commander des produits artisanaux.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nom</label>
                        <input 
                            type="text" 
                            name="full_name" 
                            placeholder="Entrez votre nom complet" 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="votre@email.com" 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Choisissez un mot de passe" 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-btn">
                        S'inscrire et continuer
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>Déjà un compte ? <span onClick={() => navigate('/login')}>Se connecter</span></p>
                </div>
            </div>
        </div>
    );
}

export default RegisterClient;