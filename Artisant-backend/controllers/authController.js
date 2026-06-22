const db = require("../config/db");
const jwt = require("jsonwebtoken");

// bcryptjs: pure-JavaScript bcrypt. No native compilation needed (unlike the 'bcrypt' package).
// Two functions we use:
//   bcrypt.hash(plainText, saltRounds) — produces a hash string, e.g. "$2b$10$abc..."
//   bcrypt.compare(plainText, hash)    — returns true if plainText matches the hash
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "artisans_maroc_secret_2024";

// saltRounds = 10 means bcrypt runs 2^10 = 1024 internal iterations.
// This makes each hash take ~100ms — fast enough for users, too slow to brute-force millions of passwords.
const SALT_ROUNDS = 10;

// ─── Helper: transparent password migration ──────────────────────────────────
// Called when a user logs in. Handles two cases:
//   1. Password is already a bcrypt hash  → use bcrypt.compare()
//   2. Password is still plain text (old account) → compare directly, then hash and save it
// After this runs, ALL users that log in are automatically upgraded to bcrypt.
async function checkPassword(submitted, stored, userId, table) {
  // bcrypt.compare() returns false (not an error) when 'stored' is not a valid hash.
  // So we can safely call it on plain-text passwords — it will just return false.
  let match = await bcrypt.compare(submitted, stored);

  if (!match && submitted === stored) {
    // The bcrypt compare failed, but plain-text compare succeeded.
    // This is a legacy account. Hash the password and save it now.
    const hashed = await bcrypt.hash(submitted, SALT_ROUNDS);
    // UPDATE the row in whichever table this user belongs to (clients or artisans).
    await db.execute(`UPDATE ${table} SET password = ? WHERE id = ?`, [
      hashed,
      userId,
    ]);
    match = true; // we confirm it's correct
  }

  return match; // true = correct password, false = wrong password
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    // Fetch by email only — we can no longer compare passwords in SQL
    // because the DB stores a hash, not the plain text.
    const [clients] = await db.execute(
      "SELECT id, full_name, password, 'client' as role FROM clients WHERE email = ?",
      [email],
    );

    // Email not found
    if (clients.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    const client = clients[0];

    // Check the submitted password against what's stored (handles both bcrypt and plain text)
    const valid = await checkPassword(
      password,
      client.password,
      client.id,
      "clients",
    );

    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    // Remove the password field before sending the user object to the frontend.
    // We never want to send a hash (or plain text) back over the network.
    const { password: _, ...userToSend } = client;

    // Sign a JWT — contains the user's id and role, expires in 8 hours.
    const token = jwt.sign({ id: userToSend.id, role: "client" }, JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.status(200).json({ success: true, token, user: userToSend });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
};

exports.loginArtisan = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    // Fetch by email only — same reason as above
    const [rows] = await db.execute(
      "SELECT id, full_name, city, email, bio, profile_picture, password, status, 'artisan' as role FROM artisans WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email incorrect" });
    }

    const artisan = rows[0];

    // Check password (handles both bcrypt hash and legacy plain text)
    const valid = await checkPassword(
      password,
      artisan.password,
      artisan.id,
      "artisans",
    );

    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Mot de passe incorrect" });
    }

    // Check if the account has been blocked by admin
    if (artisan.status === "bloque") {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Votre compte a été bloqué. Veuillez contacter le support.",
      });
    }

    // Strip the password from the object before sending it
    const { password: _, ...userToSend } = artisan;

    const token = jwt.sign({ id: userToSend.id, role: "artisan" }, JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.status(200).json({ success: true, token, user: userToSend });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.registerClient = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    const [existingUser] = await db.execute(
      "SELECT id FROM clients WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "ce compte existe deja" });
    }

    // Hash the password BEFORE inserting into the database.
    // From this point on, the plain-text password never touches the DB.
    // bcrypt.hash() is async because 1024 iterations take real time (~100ms).
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(
      "INSERT INTO clients (full_name, email, password) VALUES (?, ?, ?)",
      [full_name, email, hashedPassword], // store the hash, not the plain text
    );

    const newUser = {
      id: result.insertId,
      full_name,
      email,
      role: "client",
    };

    return res
      .status(201)
      .json({ message: "Inscription réussie", user: newUser });
  } catch (error) {
    console.error("Erreur Inscription:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de l'inscription" });
  }
};

// OPTION 1 — Gmail SMTP (MAIL_USER + MAIL_PASS in .env)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT id, full_name, email FROM clients WHERE email = ?",
      [email],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Aucun compte trouvé avec cet email." });

    const client = rows[0];
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(
      "UPDATE clients SET reset_code = ?, reset_code_expires = ? WHERE id = ?",
      [code, expires, client.id],
    );

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Artisans du Maroc" <${process.env.MAIL_USER}>`,
      to: client.email,
      subject: "Code de réinitialisation — Artisans du Maroc",
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
        <p>Bonjour <strong>${client.full_name}</strong>,</p>
        <p>Votre code de réinitialisation de mot de passe est :</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#b95d2b;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>`,
    });

    res.json({ success: true, clientId: client.id });
  } catch (err) {
    console.error("forgotPassword error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// OPTION 2 — Brevo REST API (BREVO_API_KEY in .env)
/*exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT id, full_name, email FROM clients WHERE email = ?',
            [email]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Aucun compte trouvé avec cet email." });

        const client = rows[0];
        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await db.execute(
            'UPDATE clients SET reset_code = ?, reset_code_expires = ? WHERE id = ?',
            [code, expires, client.id]
        );

        const axios = require('axios');
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: 'Artisans du Maroc', email: 'artisansdumarocc@gmail.com' },
            to: [{ email: client.email, name: client.full_name }],
            subject: 'Code de réinitialisation — Artisans du Maroc',
            htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                    <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                    <p>Bonjour <strong>${client.full_name}</strong>,</p>
                    <p>Votre code de réinitialisation de mot de passe est :</p>
                    <div style="text-align:center;margin:24px 0;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#b95d2b;">${code}</span>
                    </div>
                    <p style="color:#888;font-size:13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
                    <p style="color:#888;font-size:13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                </div>
            `
        }, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, clientId: client.id });
    } catch (err) {
        console.error('forgotPassword error:', err.response?.data || err.message);
        res.status(500).json({ message: err.message });
    }
};*/

exports.verifyResetCode = async (req, res) => {
  const { clientId, code } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT reset_code, reset_code_expires FROM clients WHERE id = ?",
      [clientId],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Client introuvable." });

    const { reset_code, reset_code_expires } = rows[0];

    if (!reset_code)
      return res.status(400).json({ message: "Aucun code généré." });

    if (new Date() > new Date(reset_code_expires))
      return res
        .status(400)
        .json({ message: "Code expiré. Veuillez recommencer." });

    if (reset_code !== code)
      return res.status(400).json({ message: "Code incorrect." });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { clientId, newPassword } = req.body;
  try {
    // Hash the new password before saving — same as registration.
    // If we saved plain text here, the user would be back to being vulnerable.
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.execute(
      "UPDATE clients SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?",
      [hashedPassword, clientId],
    );
    res.json({
      success: true,
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
