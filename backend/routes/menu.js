const express = require('express');
const menuController = require('../controllers/menuController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/restaurant/:restaurant_id', menuController.getRestaurantMenu);
router.get('/vendor/restaurant/:restaurant_id', authenticateToken, requireRole(['vendor']), menuController.getVendorMenu);
router.post('/vendor/item', authenticateToken, requireRole(['vendor']), menuController.addMenuItem);
router.delete('/vendor/item/:item_id', authenticateToken, requireRole(['vendor']), menuController.deleteMenuItem);

module.exports = router;