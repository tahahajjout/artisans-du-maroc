const db = require('../config/db');

// Save feedback
exports.submitFeedback = async (req, res) => {
    // 1. Extract data from the request body
    const { stars, comment, user_type } = req.body;

    // 2. Validate — stars is required
    if (!stars || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "La note est requise (1 à 5)." });
    }

    try {
        // 3. Insert into database
        await db.execute(
            'INSERT INTO site_feedback (stars, comment, user_type) VALUES (?, ?, ?)',
            [stars, comment || null, user_type || 'visiteur']
        );

        // 4. Respond with success
        res.status(201).json({ success: true });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all feedbacks for admin
exports.getAllFeedback = async (req, res) => {
    try {
        // 1. Get all feedbacks ordered by newest first
        const [rows] = await db.execute(
            'SELECT * FROM site_feedback ORDER BY created_at DESC'
        );

        // 2. Calculate average rating
        const average = rows.length > 0
            ? (rows.reduce((sum, r) => sum + r.stars, 0) / rows.length).toFixed(1)
            : 0;

        // 3. Send both the list and the average
        res.json({ feedbacks: rows, average, total: rows.length });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};