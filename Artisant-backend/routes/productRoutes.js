const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyArtisan = require('../middleware/verifyArtisan');
const verifyClient = require('../middleware/verifyClient');

router.post('/add', verifyArtisan, productController.uploadImage, productController.addProduct);
router.post('/rate', verifyClient, productController.rateProduct);
router.post('/:productId/visit', productController.trackProductVisit);


router.get('/recommendations/:clientId', productController.getRecommendations);
router.get('/by-category/:categoryName', productController.getProductsByCategory);
router.get('/visits/artisan/:artisanId', productController.getProductVisitRanking);
router.get('/artisan/:artisanId/public', productController.getArtisanPublicProducts);
router.get('/artisan/:artisanId', productController.getArtisanProducts);


router.get('/:id', productController.getProductById);
router.get('/:productId/comments', productController.getProductComments);


router.delete('/:id', verifyArtisan, productController.deleteProduct);
router.put('/:id', verifyArtisan, productController.uploadImage, productController.updateProduct);

module.exports = router;