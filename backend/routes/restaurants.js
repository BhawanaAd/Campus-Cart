const express = require('express');
const restaurantController = require('../controllers/restaurantController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

router.get('/vendor/my-restaurants', authenticateToken, requireRole(['vendor']), restaurantController.getVendorRestaurants);
router.patch('/:restaurant_id/status', authenticateToken, requireRole(['vendor']), restaurantController.updateRestaurantStatus);

module.exports = router;