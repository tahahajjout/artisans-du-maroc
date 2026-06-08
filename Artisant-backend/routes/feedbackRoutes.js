const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');

// Public route — anyone can submit feedback
router.post('/submit', submitFeedback);

// Admin route — get all feedbacks
router.get('/all', getAllFeedback);

module.exports = router;