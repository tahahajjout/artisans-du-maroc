import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeedbackWidget.css';

function FeedbackWidget() {
    const [visible, setVisible]       = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [stars, setStars]           = useState(0);
    const [hoverStar, setHoverStar]   = useState(0);
    const [comment, setComment]       = useState('');
    const [submitted, setSubmitted]   = useState(false);
    const [error, setError]           = useState('');

    // Initialize done directly from localStorage — no delay
    const [done, setDone] = useState(() => !!localStorage.getItem('feedbackGiven'));

    const user     = JSON.parse(localStorage.getItem('user'));
    const userType = user ? (user.role === 'client' ? 'client' : 'visiteur') : 'visiteur';

    useEffect(() => {
        // If already done — don't set up listener
        if (done) return;

        const handleProductClick = () => {
            setClickCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 2) setVisible(true);
                return newCount;
            });
        };

        window.addEventListener('productClicked', handleProductClick);
        return () => window.removeEventListener('productClicked', handleProductClick);
    }, [done]);

    const handleDismiss = () => {
        localStorage.setItem('feedbackGiven', 'true');
        setDone(true);
        setVisible(false);
    };

    const handleSubmit = async () => {
    if (stars === 0) { setError("Veuillez sélectionner une note."); return; }
    try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/feedback/submit`, {
            stars,
            comment,
            user_type: userType
        });
        localStorage.setItem('feedbackGiven', 'true');
        setSubmitted(true); // show success message first
        setTimeout(() => {
            setDone(true);   // kill after 2 seconds
            setVisible(false);
        }, 2000);
    } catch {
        setError("Erreur lors de l'envoi. Réessayez.");
    }
};

    if (done || !visible) return null;

    return (
        <div className="feedback-widget">
            <button className="feedback-close" onClick={handleDismiss}>✕</button>

            {submitted ? (
                <div className="feedback-success">
                    <div className="feedback-success-icon">✅</div>
                    <p>Merci pour votre avis !</p>
                </div>
            ) : (
                <>
                    <p className="feedback-title">Votre avis sur le site</p>
                    <p className="feedback-subtitle">Cela nous aide à améliorer votre expérience</p>

                    <div className="feedback-stars">
                        {[1, 2, 3, 4, 5].map(n => (
                            <span
                                key={n}
                                className={`feedback-star ${n <= (hoverStar || stars) ? 'filled' : ''}`}
                                onMouseEnter={() => setHoverStar(n)}
                                onMouseLeave={() => setHoverStar(0)}
                                onClick={() => { setStars(n); setError(''); }}
                            >★</span>
                        ))}
                    </div>

                    <textarea
                        className="feedback-comment"
                        placeholder="Un commentaire ? (optionnel)"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                    />

                    {error && <p className="feedback-error">{error}</p>}

                    <button className="feedback-submit" onClick={handleSubmit}>
                        Envoyer
                    </button>
                </>
            )}
        </div>
    );
}

export default FeedbackWidget;