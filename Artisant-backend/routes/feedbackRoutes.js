const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');
const verifyAdmin = require('../middleware/verifyAdmin');

router.post('/submit', submitFeedback);
router.get('/all', verifyAdmin, getAllFeedback);

module.exports = router;