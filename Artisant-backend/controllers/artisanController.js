const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadProfilePicture = upload.fields([
  { name: "profile_picture", maxCount: 1 },
  { name: "banner_photo", maxCount: 1 },
]);

// 1. Récupérer toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories");
    if (rows.length === 0) console.log("⚠️ Table 'categories' vide.");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Récupérer le Top 8 des villes
exports.getTopCities = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT city, COUNT(*) as count FROM artisans GROUP BY city ORDER BY count DESC LIMIT 8",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Meilleur artisan par ville
exports.getBestArtisanByCity = async (req, res) => {
  try {
    const query = `
            SELECT * FROM v_artisan_rating_summaries 
            WHERE city = ? 
            ORDER BY average_rating DESC, full_name ASC 
            LIMIT 1`;
    const [rows] = await db.query(query, [req.params.city]);
    res.json(rows[0] || null);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'artisan" });
  }
};

exports.getArtisanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      "SELECT id, full_name, city, email, bio, profile_picture, banner_photo, phone_number FROM artisans WHERE id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Artisan non trouvé" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getPublicArtisan = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, city, bio, profile_picture, banner_photo, phone_number 
             FROM artisans 
             WHERE id = ? AND status = 'actif'`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Artisan non trouvé" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("ERREUR SQL :", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, city, bio, phone_number } = req.body;

    const newProfilePic = req.files?.["profile_picture"]?.[0]?.filename || null;
    const newBanner = req.files?.["banner_photo"]?.[0]?.filename || null;

    // Build dynamic SET clause based on what was uploaded
    let sets = [
      "full_name = ?",
      "email = ?",
      "city = ?",
      "bio = ?",
      "phone_number = ?",
    ];
    let params = [full_name, email, city, bio, phone_number];

    if (newProfilePic) {
      sets.push("profile_picture = ?");
      params.push(newProfilePic);
    }
    if (newBanner) {
      sets.push("banner_photo = ?");
      params.push(newBanner);
    }

    params.push(id);
    const sql = `UPDATE artisans SET ${sets.join(", ")} WHERE id = ?`;
    await db.execute(sql, params);

    res.status(200).json({
      success: true,
      message: "Profil mis à jour",
      newImagePath: newProfilePic,
      newBannerPath: newBanner,
    });
  } catch (error) {
    console.error("Erreur SQL lors de l'update:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT password FROM artisans WHERE id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Artisan non trouvé" });

    if (rows[0].password !== current_password)
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });

    if (current_password === new_password)
      return res
        .status(400)
        .json({ error: "Le nouveau mot de passe est identique à l'ancien" });

    await db.execute("UPDATE artisans SET password = ? WHERE id = ?", [
      new_password,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopArtisansPerCity = async (req, res) => {
  try {
    const query = `
            WITH ArtisanStats AS (
                SELECT 
                    a.id, a.full_name, a.city, a.profile_picture,
                    IFNULL(AVG(r.stars), 0) as average_rating
                FROM artisans a
                LEFT JOIN products p ON a.id = p.artisan_id
                LEFT JOIN ratings r ON p.id = r.product_id
                WHERE a.status = 'actif'
                GROUP BY a.id
            ),
            RankedArtisans AS (
                SELECT *,
                ROW_NUMBER() OVER (PARTITION BY city ORDER BY average_rating DESC) as rnk
                FROM ArtisanStats
            )
            SELECT * FROM RankedArtisans WHERE rnk = 1 ORDER BY average_rating DESC;
        `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur SQL" });
  }
};

exports.registerArtisan = async (req, res) => {
  try {
    // 1. On récupère toutes les données envoyées par le formulaire React
    const { full_name, email, password, bio, city, phone_number } = req.body;
    let profile_picture = null;
    let banner_photo = null;

    if (req.files?.["profile_picture"]?.[0]) {
      profile_picture = req.files["profile_picture"][0].filename;
    }
    if (req.files?.["banner_photo"]?.[0]) {
      banner_photo = req.files["banner_photo"][0].filename;
    }

    // 3. Vérifier si l'artisan existe déjà avec cet email
    const checkQuery = "SELECT * FROM artisans WHERE email = ?";
    const [existingArtisan] = await db.query(checkQuery, [email]);

    if (existingArtisan.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé par un autre artisan.",
      });
    }

    // 4. Insérer le nouvel artisan dans la base de données
    const insertQuery = `
            INSERT INTO artisans (full_name, email, password, bio, city, phone_number, profile_picture, banner_photo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    await db.query(insertQuery, [
      full_name,
      email,
      password,
      bio,
      city,
      phone_number,
      profile_picture,
      banner_photo,
    ]);

    // 5. Répondre au Frontend que tout s'est bien passé
    res.status(201).json({
      success: true,
      message: "Inscription réussie. Bienvenue parmi les artisans du Maroc !",
    });
  } catch (error) {
    // En cas de problème (ex: base de données éteinte, erreur de syntaxe SQL)
    console.error(
      "Erreur critique lors de l'inscription de l'artisan :",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue sur le serveur lors de l'inscription.",
    });
  }
};

exports.deleteArtisan = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    const [rows] = await db.execute("SELECT * FROM artisans WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Artisan non trouvé." });

    const artisan = rows[0];
    if (artisan.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Mot de passe incorrect." });
    }

    await db.execute("DELETE FROM products WHERE artisan_id = ?", [id]);
    await db.execute("DELETE FROM artisans WHERE id = ?", [id]);

    res.json({ success: true, message: "Compte supprimé." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

exports.search = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "")
    return res.status(400).json({ message: "Terme vide." });

  try {
    const term = `%${q.trim()}%`;

    const [artisans] = await db.execute(
      `SELECT id, full_name, city, profile_picture FROM artisans WHERE full_name LIKE ? AND status = 'actif'`,
      [term],
    );

    const [products] = await db.execute(
      `SELECT p.id, p.title, p.price, p.image_url, p.description,
                    a.id AS artisan_id, a.full_name AS artisan_name, a.phone_number
             FROM products p
             JOIN artisans a ON p.artisan_id = a.id
             WHERE p.title LIKE ? `,
      [term],
    );

    res.json({ artisans, products });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT id, full_name, email FROM artisans WHERE email = ?",
      [email],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Aucun compte trouvé avec cet email." });

    const artisan = rows[0];

    // Generate 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.execute(
      "UPDATE artisans SET reset_code = ?, reset_code_expires = ? WHERE id = ?",
      [code, expires, artisan.id],
    );

    // Send email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Artisans du Maroc" <taha2000hajjout@gmail.com>',
      to: artisan.email,
      subject: "Code de réinitialisation — Artisans du Maroc",
      html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                    <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                    <p>Bonjour <strong>${artisan.full_name}</strong>,</p>
                    <p>Votre code de réinitialisation de mot de passe est :</p>
                    <div style="text-align:center;margin:24px 0;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#b95d2b;">${code}</span>
                    </div>
                    <p style="color:#888;font-size:13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
                    <p style="color:#888;font-size:13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                </div>
            `,
    });

    /*const axios = require("axios");
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Artisans du Maroc",
          email: "artisansdumarocc@gmail.com",
        },
        to: [{ email: artisan.email, name: artisan.full_name }],
        subject: "Code de réinitialisation — Artisans du Maroc",
        htmlContent: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
                    <h2 style="color:#b95d2b;">Artisans du Maroc</h2>
                    <p>Bonjour <strong>${artisan.full_name}</strong>,</p>
                    <p>Votre code de réinitialisation de mot de passe est :</p>
                    <div style="text-align:center;margin:24px 0;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#b95d2b;">${code}</span>
                    </div>
                    <p style="color:#888;font-size:13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
                    <p style="color:#888;font-size:13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                </div>
            `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );*/

    res.json({ success: true, artisanId: artisan.id });
  } catch (err) {
    console.error("forgotPassword error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  const { artisanId, code } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT reset_code, reset_code_expires FROM artisans WHERE id = ?",
      [artisanId],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Artisan introuvable." });

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
  const { artisanId, newPassword } = req.body;
  try {
    await db.execute(
      "UPDATE artisans SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?",
      [newPassword, artisanId],
    );
    res.json({
      success: true,
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
