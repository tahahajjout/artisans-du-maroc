const express = require('express');
const router = express.Router();
const artisanController = require('../controllers/artisanController');

router.post('/forgot-password', artisanController.forgotPassword);
router.post('/verify-reset-code', artisanController.verifyResetCode);
router.post('/reset-password', artisanController.resetPassword);
router.post('/register-artisan', artisanController.uploadProfilePicture, artisanController.registerArtisan);

router.get('/categories', artisanController.getAllCategories);
router.get('/search', artisanController.search);
router.get('/top-cities', artisanController.getTopCities);
router.get('/best-artisan/:city', artisanController.getBestArtisanByCity);
router.get('/artisan/private/:id', artisanController.getArtisanById);
router.get('/artisan/:id', artisanController.getPublicArtisan);
router.get('/top-by-city', artisanController.getTopArtisansPerCity);

router.put('/update/:id', artisanController.uploadProfilePicture, artisanController.updateArtisan);
router.put('/artisan/:id/change-password', artisanController.changePassword);


router.delete('/artisan/:id', artisanController.deleteArtisan);



module.exports = router;