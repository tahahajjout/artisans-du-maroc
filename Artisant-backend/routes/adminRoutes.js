    const express = require('express');
    const router = express.Router();
    const { adminLogin, getAllClients, getAllArtisans, deleteArtisan, updateArtisanStatus  } = require('../controllers/adminController');

    router.post('/login', adminLogin);
    router.get('/clients', getAllClients);
    router.get('/artisans', getAllArtisans);
    router.delete('/artisan/:id', deleteArtisan);
    router.put('/artisan/:id/status', updateArtisanStatus);
    module.exports = router;