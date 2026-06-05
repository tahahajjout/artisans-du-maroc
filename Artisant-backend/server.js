const express = require('express');
const cors = require('cors');
const path = require('path');   
require('dotenv').config();

// IMPORT DES ROUTES
const artisanRoutes = require('./routes/artisanRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');


const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', artisanRoutes);






// GESTION D'ERREUR 404 
app.use((req, res) => {
    res.status(404).json({ message: "La route demandée n'existe pas." });
});


// LANCEMENT DU SERVEUR
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
  
    SERVEUR ARTISANS DU MAROC LANCÉ
     Port: ${PORT}
    URL: http://localhost:${PORT}`);
});


/* test*/
// Temporary test route — remove after fixing
app.get('/test-email', async (req, res) => {
    const axios = require('axios');
    try {
        const result = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: 'Test', email: 'artisansdumarocc@gmail.com' },
            to: [{ email: 'artisansdumarocc@gmail.com', name: 'Test' }],
            subject: 'Test Railway',
            htmlContent: '<p>Test email from Railway</p>'
        }, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        res.json({ success: true, data: result.data });
    } catch (err) {
        res.json({ 
            success: false, 
            error: err.response?.data,
            status: err.response?.status,
            message: err.message
        });
    }
});