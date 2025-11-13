const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/vendor', authenticateToken, requireRole(['vendor']), inventoryController.getVendorInventory);
router.get('/alerts/low-stock', authenticateToken, requireRole(['vendor']), inventoryController.getLowStockAlerts);
router.post('/restock', authenticateToken, requireRole(['vendor']), inventoryController.restockItem);
router.post('/adjust', authenticateToken, requireRole(['vendor']), inventoryController.adjustStock);
router.get('/logs/:item_id', authenticateToken, requireRole(['vendor']), inventoryController.getItemLogs);

module.exports = router;