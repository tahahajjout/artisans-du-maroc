const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "artisans_maroc_secret_2024";

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM admins WHERE username = ? AND password = ?",
      [username, password],
    );
    if (!rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: rows[0].id, role: "admin" }, JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({
      success: true,
      token,
      adminId: rows[0].id,
      username: rows[0].username,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, full_name, email, created_at FROM clients",
    );
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
    await db.execute("DELETE FROM artisans WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*const sendStatusEmail = async (artisan, status) => {
  const axios = require("axios");
  const isBlocked = status === "bloque";

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Artisans du Maroc",
        email: "artisansdumarocc@gmail.com",
      },
      to: [{ email: artisan.email, name: artisan.full_name }],
      subject: isBlocked
        ? "Votre compte a été bloqué — Artisans du Maroc"
        : "Votre compte est activé — Artisans du Maroc",
      htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                <p>Bonjour <strong>${artisan.full_name}</strong>,</p>
                ${
                  isBlocked
                    ? `<p>Votre compte a été <strong style="color:#e74c3c;">bloqué</strong> par l'administrateur. Vous ne pouvez plus accéder à votre espace artisan.</p>
                       <p>Pour toute réclamation, contactez notre support.</p>`
                    : `<p>Votre compte a été <strong style="color:#28a745;">activé</strong>. Vous êtes maintenant visible publiquement sur la plateforme.</p>`
                }
                <p style="color:#888;font-size:13px;margin-top:24px;">Cordialement,<br/>L'équipe Artisans du Maroc</p>
            </div>
        `,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
};*/

const sendStatusEmail = async (artisan, status) => {
  console.log("sendStatusEmail called for:", artisan.email, status);
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  /*const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });*/

  const isBlocked = status === "bloque";

  await transporter.sendMail({
    from: `"Artisans du Maroc" <${process.env.MAIL_USER}>`,
    to: artisan.email,
    subject: isBlocked
      ? "Votre compte a été bloqué — Artisans du Maroc"
      : "Votre compte est activé — Artisans du Maroc",
    html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                <p>Bonjour <strong>${artisan.full_name}</strong>,</p>
                ${
                  isBlocked
                    ? `<p>Votre compte a été <strong style="color:#e74c3c;">bloqué</strong> par l'administrateur. Vous ne pouvez plus accéder à votre espace artisan.</p>
                       <p>Pour toute réclamation, contactez notre support.</p>`
                    : `<p>Votre compte a été <strong style="color:#28a745;">activé</strong>. Vous êtes maintenant visible publiquement sur la plateforme.</p>`
                }
                <p style="color:#888;font-size:13px;margin-top:24px;">Cordialement,<br/>L'équipe Artisans du Maroc</p>
            </div>
        `,
  });
};

exports.updateArtisanStatus = async (req, res) => {
  console.log("updateArtisanStatus called, status:", req.body.status);
  const { id } = req.params;
  const { status } = req.body;

  if (!["actif", "bloque", "en_attente"].includes(status))
    return res.status(400).json({ message: "Statut invalide." });

  try {
    const [rows] = await db.execute(
      "SELECT full_name, email FROM artisans WHERE id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Artisan introuvable." });

    await db.execute("UPDATE artisans SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    // Respond immediately
    res.json({ success: true });

    if (status !== "en_attente") {
      sendStatusEmail(rows[0], status).catch((err) => {
        console.warn("Email non envoyé:", err.message);
        console.log("Full error:", err);
      });
    }
  } catch (err) {
    console.error("updateArtisanStatus error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
// ── Add this to adminController.js ──

exports.getStats = async (req, res) => {
  try {
    const [[{ total_artisans }]] = await db.execute(
      "SELECT COUNT(*) AS total_artisans FROM artisans",
    );
    const [[{ total_clients }]] = await db.execute(
      "SELECT COUNT(*) AS total_clients FROM clients",
    );
    const [[{ total_products }]] = await db.execute(
      "SELECT COUNT(*) AS total_products FROM products",
    );
    const [[{ total_visits }]] = await db.execute(
      "SELECT COUNT(*) AS total_visits FROM product_visits",
    );

    const [[{ artisans_actif }]] = await db.execute(
      "SELECT COUNT(*) AS artisans_actif FROM artisans WHERE status = 'actif'",
    );
    const [[{ artisans_en_attente }]] = await db.execute(
      "SELECT COUNT(*) AS artisans_en_attente FROM artisans WHERE status = 'en_attente'",
    );
    const [[{ artisans_bloque }]] = await db.execute(
      "SELECT COUNT(*) AS artisans_bloque FROM artisans WHERE status = 'bloque'",
    );

    // Best artisan by average rating
    const [bestArtisanRows] = await db.execute(`
            SELECT a.id, a.full_name, a.city,
                   ROUND(AVG(r.stars), 1) AS average_rating
            FROM artisans a
            JOIN products p ON p.artisan_id = a.id
            JOIN ratings r ON r.product_id = p.id
            WHERE a.status = 'actif'
            GROUP BY a.id
            ORDER BY average_rating DESC
            LIMIT 1
        `);

    // Best product by average rating
    const [bestProductRows] = await db.execute(`
            SELECT p.id, p.title,
                   a.full_name AS artisan_name,
                   ROUND(AVG(r.stars), 1) AS average_rating
            FROM products p
            JOIN artisans a ON p.artisan_id = a.id
            JOIN ratings r ON r.product_id = p.id
            GROUP BY p.id
            ORDER BY average_rating DESC
            LIMIT 1
        `);

    res.json({
      total_artisans,
      total_clients,
      total_products,
      total_visits,
      artisans_actif,
      artisans_en_attente,
      artisans_bloque,
      best_artisan: bestArtisanRows[0] || null,
      best_product: bestProductRows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
