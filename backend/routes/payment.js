const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Order creation endpoint
router.post('/create-order', authenticateToken, paymentController.createOrder);

// Payment signature verification endpoint
router.post('/verify-payment', authenticateToken, paymentController.verifyPayment);

module.exports = router;
