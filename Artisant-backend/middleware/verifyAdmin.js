const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'artisans_maroc_secret_2024';

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN" → TOKEN
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
        req.admin = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};
