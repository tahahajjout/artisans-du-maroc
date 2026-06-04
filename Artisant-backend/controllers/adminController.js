const db = require('../config/db');
const multer = require('multer');
const path = require('path');

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? AND password = ?',
      [username, password]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, adminId: rows[0].id, username: rows[0].username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, full_name, email, created_at FROM clients');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllArtisans = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id, a.full_name, a.email, a.city, a.phone_number, a.status,
             ROUND(AVG(r.stars), 1) AS average_rating,
             COUNT(DISTINCT p.id) AS product_count
      FROM artisans a
      LEFT JOIN products p ON p.artisan_id = a.id
      LEFT JOIN ratings r ON r.product_id = p.id
      GROUP BY a.id
      ORDER BY average_rating DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteArtisan = async (req, res) => {
  try {
    await db.execute('DELETE FROM artisans WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const sendStatusEmail = async (artisan, status) => {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    const isBlocked = status === 'bloque';

    await transporter.sendMail({
        from: `"Artisans du Maroc" <${process.env.MAIL_USER}>`,
        to: artisan.email,
        subject: isBlocked
            ? 'Votre compte a été bloqué — Artisans du Maroc'
            : 'Votre compte est activé — Artisans du Maroc',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                <p>Bonjour <strong>${artisan.full_name}</strong>,</p>
                ${isBlocked
                    ? `<p>Votre compte a été <strong style="color:#e74c3c;">bloqué</strong> par l'administrateur. Vous ne pouvez plus accéder à votre espace artisan.</p>
                       <p>Pour toute réclamation, contactez notre support.</p>`
                    : `<p>Votre compte a été <strong style="color:#28a745;">activé</strong>. Vous êtes maintenant visible publiquement sur la plateforme.</p>`
                }
                <p style="color:#888;font-size:13px;margin-top:24px;">Cordialement,<br/>L'équipe Artisans du Maroc</p>
            </div>
        `
    });
};

exports.updateArtisanStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['actif', 'bloque', 'en_attente'].includes(status))
        return res.status(400).json({ message: "Statut invalide." });

    try {
        const [rows] = await db.execute('SELECT full_name, email FROM artisans WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Artisan introuvable." });

        await db.execute('UPDATE artisans SET status = ? WHERE id = ?', [status, id]);

        // Respond immediately
        res.json({ success: true });

        // Send email in background
        if (status !== 'en_attente') {
            sendStatusEmail(rows[0], status).catch(err => {
                console.warn('Email non envoyé:', err.message);
            });
        }

    } catch (err) {
        console.error('updateArtisanStatus error:', err.message);
        res.status(500).json({ message: err.message });
    }
};