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


