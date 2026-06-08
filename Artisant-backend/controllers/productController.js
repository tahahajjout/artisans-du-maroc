const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname)); }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB to allow videos
});

// Single image for main product image
exports.uploadImage = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 20 }
]);

// ── ADD PRODUCT ──────────────────────────────────────────────────────────────
exports.addProduct = async (req, res) => {
    try {
        const { title, description, price, category_id, artisan_id, hauteur, largeur, couleur, matiere   } = req.body;
        const image_url = req.files?.['image']?.[0]?.filename || null;

        if (!title || !price || !category_id || !artisan_id || !image_url) {
            return res.status(400).json({
                message: "Tous les champs marqués d'une étoile (*) sont obligatoires, y compris l'image."
            });
        }

        const [result] = await db.execute(`
            INSERT INTO products (title, description, price, image_url, category_id, artisan_id, hauteur, largeur, couleur, matiere )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, description || '', price, image_url, category_id, artisan_id,
            hauteur || null, largeur || null, couleur || null, matiere  || null]);

        const productId = result.insertId;

        // Insert gallery files
        const galleryFiles = req.files?.['gallery'] || [];
        for (const file of galleryFiles) {
            const fileType = file.mimetype.startsWith('video') ? 'video' : 'image';
            await db.execute(
                'INSERT INTO product_gallery (product_id, file_url, file_type) VALUES (?, ?, ?)',
                [productId, file.filename, fileType]
            );
        }

        res.status(201).json({ message: "Produit ajouté avec succès !", productId });

    } catch (error) {
        console.error("Erreur SQL détaillée :", error);
        res.status(500).json({ message: "Erreur lors de la sauvegarde en base de données." });
    }
};

// ── GET ARTISAN PRODUCTS (private dashboard) ─────────────────────────────────
exports.getArtisanProducts = async (req, res) => {
    const { artisanId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT p.*,
                   IFNULL(AVG(r.stars), 0) AS average_rating,
                   COUNT(DISTINCT r.id) AS rating_count,
                   COUNT(DISTINCT pv.id) AS visit_count
            FROM products p
            LEFT JOIN ratings r ON r.product_id = p.id
            LEFT JOIN product_visits pv ON pv.product_id = p.id
            WHERE p.artisan_id = ?
            GROUP BY p.id
            ORDER BY p.id DESC
        `, [artisanId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Impossible de charger vos produits." });
    }
};

// ── GET PRODUCT COMMENTS ─────────────────────────────────────────────────────
exports.getProductComments = async (req, res) => {
    const { productId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT r.stars, r.comment, r.id, c.full_name AS client_name
            FROM ratings r
            JOIN clients c ON r.client_id = c.id
            WHERE r.product_id = ?
            ORDER BY r.id DESC
        `, [productId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── DELETE PRODUCT ───────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        // Delete gallery files from disk first
        const [gallery] = await db.execute('SELECT file_url FROM product_gallery WHERE product_id = ?', [req.params.id]);
        gallery.forEach(g => {
            const filePath = path.join('uploads', g.file_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        await db.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
        res.json({ message: "Produit supprimé" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── UPDATE PRODUCT ───────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { title, price, description, category_id, hauteur, largeur, couleur, matiere , deletedGalleryIds } = req.body;

    try {
        // Build dynamic SET clause
        let sets = ['title = ?', 'price = ?', 'description = ?', 'category_id = ?',
                    'hauteur = ?', 'largeur = ?', 'couleur = ?', 'matiere  = ?'];
        let params = [title, price, description, category_id,
                      hauteur || null, largeur || null, couleur || null, matiere  || null];

        if (req.files?.['image']?.[0]) {
            sets.push('image_url = ?');
            params.push(req.files['image'][0].filename);
        }

        params.push(id);
        await db.execute(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);

        // Delete gallery items requested
        if (deletedGalleryIds) {
            const ids = JSON.parse(deletedGalleryIds);
            for (const gid of ids) {
                const [rows] = await db.execute('SELECT file_url FROM product_gallery WHERE id = ?', [gid]);
                if (rows.length > 0) {
                    const filePath = path.join('uploads', rows[0].file_url);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    await db.execute('DELETE FROM product_gallery WHERE id = ?', [gid]);
                }
            }
        }

        // Insert new gallery files
        const galleryFiles = req.files?.['gallery'] || [];
        for (const file of galleryFiles) {
            const fileType = file.mimetype.startsWith('video') ? 'video' : 'image';
            await db.execute(
                'INSERT INTO product_gallery (product_id, file_url, file_type) VALUES (?, ?, ?)',
                [id, file.filename, fileType]
            );
        }

        res.json({ success: true, message: "Produit mis à jour avec succès" });

    } catch (error) {
        console.error("Erreur Backend Update:", error);
        res.status(500).json({ error: error.message });
    }
};

// ── GET PRODUCT BY ID (includes gallery) ────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Produit non trouvé" });

        const product = rows[0];

        // Fetch gallery
        const [gallery] = await db.execute(
            'SELECT id, file_url, file_type FROM product_gallery WHERE product_id = ? ORDER BY id ASC',
            [req.params.id]
        );
        product.gallery = gallery;

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── GET PRODUCTS BY CATEGORY ─────────────────────────────────────────────────
exports.getProductsByCategory = async (req, res) => {
    const { categoryName } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT p.id, p.title, p.description, p.price, p.image_url,
                   p.hauteur, p.largeur, p.couleur, p.matiere ,
                   a.id AS artisan_id, a.full_name AS artisan_name, a.city AS artisan_city,
                   IFNULL(AVG(r.stars), 0) AS average_rating,
                   COUNT(r.id) AS rating_count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN artisans a ON p.artisan_id = a.id
            LEFT JOIN ratings r ON p.id = r.product_id
            WHERE LOWER(c.name) = LOWER(?) AND a.status = 'actif'
            GROUP BY p.id, a.id
            ORDER BY average_rating DESC, p.title ASC
        `, [categoryName]);

        // Attach gallery to each product
        for (const p of rows) {
            const [gallery] = await db.execute(
                'SELECT id, file_url, file_type FROM product_gallery WHERE product_id = ? ORDER BY id ASC',
                [p.id]
            );
            p.gallery = gallery;
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET ARTISAN PUBLIC PRODUCTS ──────────────────────────────────────────────
exports.getArtisanPublicProducts = async (req, res) => {
    const { artisanId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT p.id, p.title, p.description, p.price, p.image_url,
                   p.hauteur, p.largeur, p.couleur, p.matiere ,
                   c.name AS category_name,
                   a.full_name AS artisan_name, a.phone_number,
                   IFNULL(AVG(r.stars), 0) AS average_rating,
                   COUNT(r.id) AS rating_count
            FROM products p
            JOIN artisans a ON p.artisan_id = a.id
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN ratings r ON p.id = r.product_id
            WHERE p.artisan_id = ? AND a.status = 'actif'
            GROUP BY p.id, c.name, a.full_name, a.phone_number
            ORDER BY average_rating DESC, p.title ASC
        `, [artisanId]);

        // Attach gallery to each product
        for (const p of rows) {
            const [gallery] = await db.execute(
                'SELECT id, file_url, file_type FROM product_gallery WHERE product_id = ? ORDER BY id ASC',
                [p.id]
            );
            p.gallery = gallery;

             const [comments] = await db.execute(
                'SELECT stars, comment FROM ratings WHERE product_id = ? ORDER BY id DESC',
                [p.id]
    );
    p.comments = comments;
        }

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── RATE PRODUCT ─────────────────────────────────────────────────────────────
exports.rateProduct = async (req, res) => {
    const { product_id, client_id, stars, comment } = req.body;
    if (!product_id || !client_id || stars === undefined)
        return res.status(400).json({ message: "Données manquantes." });
    if (stars < 1 || stars > 5)
        return res.status(400).json({ message: "La note doit être entre 1 et 5." });
    try {
        await db.execute(`
            INSERT INTO ratings (product_id, client_id, stars, comment)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment)
        `, [product_id, client_id, stars, comment || null]);
        res.json({ success: true, message: "Merci pour votre avis !" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de l'enregistrement de la note." });
    }
};

// ── TRACK PRODUCT VISIT ──────────────────────────────────────────────────────
exports.trackProductVisit = async (req, res) => {
    const { productId } = req.params;
    const { client_id } = req.body;
    try {
        await db.execute(
            'INSERT INTO product_visits (product_id, client_id) VALUES (?, ?)',
            [productId, client_id || null]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET PRODUCT VISIT RANKING (artisan dashboard) ────────────────────────────
exports.getProductVisitRanking = async (req, res) => {
    const { artisanId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT p.id, p.title, p.image_url, p.price,
                   COUNT(pv.id) AS visit_count
            FROM products p
            LEFT JOIN product_visits pv ON p.id = pv.product_id
            WHERE p.artisan_id = ?
            GROUP BY p.id
            ORDER BY visit_count DESC
        `, [artisanId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── RECOMMENDATIONS ──────────────────────────────────────────────────────────
exports.getRecommendations = async (req, res) => {
    const { clientId } = req.params;

    // Helper to attach gallery to a list of products
    const attachGallery = async (products) => {
        for (const p of products) {
            const [gallery] = await db.execute(
                'SELECT id, file_url, file_type FROM product_gallery WHERE product_id = ? ORDER BY id ASC',
                [p.id]
            );
            p.gallery = gallery;
        }
        return products;
    };
  // Helper to attach comments to a list of products
    const attachComments = async (products) => {
    for (const p of products) {
        const [comments] = await db.execute(
            'SELECT stars, comment FROM ratings WHERE product_id = ? ORDER BY id DESC',
            [p.id]
        );
        p.comments = comments;
    }
    return products;
};

    const generalQuery = `
        SELECT p.id, p.title, p.price, p.image_url,
               p.hauteur, p.largeur, p.couleur,p.matiere , p.description,
               a.id AS artisan_id, a.full_name AS artisan_name, a.phone_number,
               c.name AS category_name,
               IFNULL(AVG(r.stars), 0) AS average_rating,
               COUNT(DISTINCT pv.id) AS visit_count
        FROM products p
        JOIN artisans a ON p.artisan_id = a.id AND a.status = 'actif'
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN ratings r ON r.product_id = p.id
        LEFT JOIN product_visits pv ON pv.product_id = p.id
        GROUP BY p.id, a.id, c.name
        ORDER BY visit_count DESC, average_rating DESC
        LIMIT 16
    `;

    try {
        if (clientId === 'guest') {
            const [rows] = await db.execute(generalQuery);
            await attachGallery(rows);
            await attachComments(rows);
            return res.json({ type: 'general', products: rows });
        }

        const [catVisits] = await db.execute(`
            SELECT c.id AS category_id, c.name AS category_name, COUNT(pv.id) AS visit_count
            FROM product_visits pv
            JOIN products p ON pv.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE pv.client_id = ?
            GROUP BY c.id, c.name
            ORDER BY visit_count DESC
            LIMIT 2
        `, [clientId]);

        if (catVisits.length === 0) {
            const [rows] = await db.execute(generalQuery);
            await attachGallery(rows);
            await attachComments(rows);
            return res.json({ type: 'general', products: rows });
        }

        const fetchFromCategory = async (categoryId) => {
            const [rows] = await db.execute(`
                SELECT p.id, p.title, p.price, p.image_url,
                       p.hauteur, p.largeur, p.couleur, p.description,p.matiere ,
                       a.id AS artisan_id, a.full_name AS artisan_name, a.phone_number,
                       c.name AS category_name,
                       IFNULL(AVG(r.stars), 0) AS average_rating,
                       COUNT(DISTINCT pv2.id) AS visit_count
                FROM products p
                JOIN artisans a ON p.artisan_id = a.id
                JOIN categories c ON p.category_id = c.id
                LEFT JOIN ratings r ON r.product_id = p.id
                LEFT JOIN product_visits pv2 ON pv2.product_id = p.id
                WHERE p.category_id = ${categoryId} AND a.status = 'actif'
                GROUP BY p.id, a.id, c.name
                ORDER BY average_rating DESC, visit_count DESC
            `);
            return rows;
        };

        const cat1Products = await fetchFromCategory(catVisits[0].category_id);
        const cat2Products = catVisits.length > 1 ? await fetchFromCategory(catVisits[1].category_id) : [];

        let take1 = Math.min(10, cat1Products.length);
        let take2 = Math.min(6, cat2Products.length);
        if (take1 < 10) take2 = Math.min(cat2Products.length, 16 - take1);
        if (take2 < 6)  take1 = Math.min(cat1Products.length, 16 - take2);

        let allProducts = [...cat1Products.slice(0, take1), ...cat2Products.slice(0, take2)]; // les ... permettent de fusionner les tableaux sans créer de sous-tableau
        const usedIds = new Set(allProducts.map(p => p.id)); // on a utilise set pour éviter les doublons pour la requete de remplissage

        const remaining = 16 - allProducts.length;
        if (remaining > 0) {
            const excludedIds    = [...usedIds].join(',') || '0'; // si usedIds est vide, on met '0' pour éviter une erreur SQL
            const excludedCatIds = catVisits.map(c => c.category_id).join(',') || '0';// exclure id des catégories déjà utilisées //join est pour chaine pour sql
            const [fillRows] = await db.execute(`
                SELECT p.id, p.title, p.price, p.image_url,
                    p.hauteur, p.largeur, p.couleur, p.description,p.matiere ,
                    a.id AS artisan_id, a.full_name AS artisan_name, a.phone_number,
                    c.name AS category_name,
                    IFNULL(AVG(r.stars), 0) AS average_rating,
                    COUNT(DISTINCT pv2.id) AS visit_count
                FROM products p
                JOIN artisans a ON p.artisan_id = a.id
                JOIN categories c ON p.category_id = c.id
                LEFT JOIN ratings r ON r.product_id = p.id
                LEFT JOIN product_visits pv2 ON pv2.product_id = p.id
                WHERE p.id NOT IN (${excludedIds})
                AND p.category_id NOT IN (${excludedCatIds})
                AND a.status = 'actif'
                GROUP BY p.id, a.id, c.name
                ORDER BY average_rating DESC, visit_count DESC
                LIMIT ${remaining}
            `);
            allProducts = [...allProducts, ...fillRows];
        }

        await attachGallery(allProducts);
        await attachComments(allProducts);

        return res.json({
            type: 'personalized',
            categories: catVisits.map(c => c.category_name),
            products: allProducts
        });

    } catch (err) {
        console.error('getRecommendations error:', err.message);
        res.status(500).json({ error: err.message });
    }
};