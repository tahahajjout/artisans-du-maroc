const db = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Veuillez remplir tous les champs" });
        }

        // 1. Chercher dans la table CLIENTS
        const [clients] = await db.execute(
            "SELECT id, full_name, 'client' as role FROM clients WHERE email = ? AND password = ?", 
            [email, password]
        );

        if (clients.length > 0) {
            return res.status(200).json({ success: true, user: clients[0] });
        }

        // 4. Si aucune correspondance
        res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion" });
    }
};



exports.loginArtisan = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Veuillez remplir tous les champs" });
        }

        // Step 1 — find by email only
        const [rows] = await db.execute(
            "SELECT id, full_name, city, email, bio, profile_picture, password, status, 'artisan' as role FROM artisans WHERE email = ?",
            [email]
        );

        // Email not found
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Email  incorrect" });
        }

        const artisan = rows[0];

        // Step 2 — check password
        if (artisan.password !== password) {
            return res.status(401).json({ success: false, message: " mot de passe incorrect" });
        }

        // Step 3 — check status
        if (artisan.status === 'bloque') {
            return res.status(403).json({
                success: false,
                blocked: true,
                message: "Votre compte a été bloqué. Veuillez contacter le support."
            });
        }

        // Step 4 — success, remove password from response
        const { password: _, ...userToSend } = artisan;

        return res.status(200).json({ success: true, user: userToSend });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};




exports.registerClient = async (req, res) => {
    
    const { full_name, email, password } = req.body;

    // 2. Validation : Tous les champs sont obligatoires
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    try {
        
        const [existingUser] = await db.execute(
            "SELECT id FROM clients WHERE email = ?", 
            [email]
        );

        if (existingUser.length > 0) {
            
            return res.status(400).json({ message: "ce compte existe deja" });
        }

        
        const [result] = await db.execute(
            "INSERT INTO clients (full_name, email, password) VALUES (?, ?, ?)",
            [full_name, email, password]
        );

        // 5. Préparer l'objet user pour la session immédiate (Auto-login)
        const newUser = {
            id: result.insertId,
            full_name: full_name,
            email: email,
            role: 'client'
        };

        return res.status(201).json({ 
            message: "Inscription réussie", 
            user: newUser 
        });

    } catch (error) {
        console.error("Erreur Inscription:", error);
        return res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT id, full_name, email FROM clients WHERE email = ?',
            [email]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Aucun compte trouvé avec cet email." });

        const client = rows[0];

        // Generate 5-digit code
        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await db.execute(
            'UPDATE clients SET reset_code = ?, reset_code_expires = ? WHERE id = ?',
            [code, expires, client.id]
        );

        // Send email
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'taha2000hajjout@gmail.com',    
                pass: 'ithm bsrz sikd tbbj'   
            }
        });

        await transporter.sendMail({
            from: '"Artisans du Maroc" <taha2000hajjout@gmail.com>',
            to: client.email,
            subject: 'Code de réinitialisation — Artisans du Maroc',
            html: `
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
        });

        res.json({ success: true, clientId: client.id });

    } catch (err) {
        console.error('forgotPassword error:', err.message);
        res.status(500).json({ message: err.message });
    }
};


exports.verifyResetCode = async (req, res) => {
    const { clientId, code } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT reset_code, reset_code_expires FROM clients WHERE id = ?',
            [clientId]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Client introuvable." });

        const { reset_code, reset_code_expires } = rows[0];

        if (!reset_code)
            return res.status(400).json({ message: "Aucun code généré." });

        if (new Date() > new Date(reset_code_expires))
            return res.status(400).json({ message: "Code expiré. Veuillez recommencer." });

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
            await db.execute(
                'UPDATE clients SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?',
                [newPassword, clientId]
            );
            res.json({ success: true, message: "Mot de passe mis à jour avec succès." });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };