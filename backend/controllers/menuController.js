const { pool } = require('../config/database');

const menuController = {
    getRestaurantMenu: async (req, res) => {
        try {
            const { restaurant_id } = req.params;

            // Fetch all menu items for the store (including available and unavailable)
            const [menuItems] = await pool.execute(`
                SELECT 
                    item_id,
                    restaurant_id,
                    item_name,
                    description,
                    price,
                    category,
                    image_url,
                    current_stock,
                    low_stock_threshold,
                    is_available,
                    created_at,
                    updated_at
                FROM menu_items 
                WHERE restaurant_id = ? 
                ORDER BY category, item_name
            `, [restaurant_id]);

            console.log(`✅ Loaded ${menuItems.length} items for restaurant ${restaurant_id}`);
            res.json({ menu: menuItems });
        } catch (error) {
            console.error('❌ Get menu error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getVendorMenu: async (req, res) => {
        try {
            const { restaurant_id } = req.params;
            const vendorId = req.user.user_id;

            const [restaurants] = await pool.execute(
                'SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? AND vendor_id = ?',
                [restaurant_id, vendorId]
            );

            if (restaurants.length === 0) {
                return res.status(404).json({ error: 'Restaurant not found or access denied' });
            }

            const [menuItems] = await pool.execute(`
                SELECT * FROM menu_items 
                WHERE restaurant_id = ?
                ORDER BY category, item_name
            `, [restaurant_id]);

            res.json({ menu: menuItems });
        } catch (error) {
            console.error('❌ Get vendor menu error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addMenuItem: async (req, res) => {
        try {
            const { restaurant_id, item_name, description, price, category, image_url, current_stock, low_stock_threshold } = req.body;
            const vendorId = req.user.user_id;

            if (!restaurant_id || !item_name || price === undefined) {
                return res.status(400).json({ error: 'Restaurant ID, item name, and price are required' });
            }

            // Verify restaurant belongs to vendor
            const [restaurants] = await pool.execute(
                'SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? AND vendor_id = ?',
                [restaurant_id, vendorId]
            );

            if (restaurants.length === 0) {
                return res.status(403).json({ error: 'Restaurant not found or access denied' });
            }

            const stock = current_stock !== undefined ? parseInt(current_stock) : 20;
            const threshold = low_stock_threshold !== undefined ? parseInt(low_stock_threshold) : 5;

            const [result] = await pool.execute(
                `INSERT INTO menu_items (restaurant_id, item_name, description, price, category, image_url, current_stock, low_stock_threshold, is_available)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [restaurant_id, item_name, description || '', parseFloat(price), category || 'General', image_url || null, stock, threshold]
            );

            console.log(`✅ Added new menu item "${item_name}" (ID: ${result.insertId}) for restaurant ${restaurant_id}`);

            res.status(201).json({
                message: 'Menu item added successfully',
                item_id: result.insertId,
                item: {
                    item_id: result.insertId,
                    restaurant_id,
                    item_name,
                    description: description || '',
                    price: parseFloat(price),
                    category: category || 'General',
                    image_url: image_url || null,
                    current_stock: stock,
                    low_stock_threshold: threshold,
                    is_available: true
                }
            });
        } catch (error) {
            console.error('❌ Add menu item error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    toggleItemAvailability: async (req, res) => {
        try {
            const { item_id } = req.params;
            const { is_available } = req.body;
            const vendorId = req.user.user_id;

            const [items] = await pool.execute(
                `SELECT mi.item_id, mi.is_available FROM menu_items mi
                 JOIN restaurants r ON mi.restaurant_id = r.restaurant_id
                 WHERE mi.item_id = ? AND r.vendor_id = ?`,
                [item_id, vendorId]
            );

            if (items.length === 0) {
                return res.status(404).json({ error: 'Item not found or access denied' });
            }

            const currentBool = (items[0].is_available == 1 || items[0].is_available === true);
            const newStatus = is_available !== undefined ? Boolean(is_available) : !currentBool;

            await pool.execute(
                'UPDATE menu_items SET is_available = ? WHERE item_id = ?',
                [newStatus ? 1 : 0, item_id]
            );

            console.log(`✅ Toggled availability for item ${item_id} to ${newStatus}`);

            res.json({ message: 'Item availability updated successfully', item_id, is_available: newStatus });
        } catch (error) {
            console.error('❌ Toggle item availability error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteMenuItem: async (req, res) => {
        try {
            const { item_id } = req.params;
            const vendorId = req.user.user_id;

            const [items] = await pool.execute(
                `SELECT mi.item_id FROM menu_items mi
                 JOIN restaurants r ON mi.restaurant_id = r.restaurant_id
                 WHERE mi.item_id = ? AND r.vendor_id = ?`,
                [item_id, vendorId]
            );

            if (items.length === 0) {
                return res.status(404).json({ error: 'Item not found or access denied' });
            }

            await pool.execute('DELETE FROM menu_items WHERE item_id = ?', [item_id]);

            res.json({ message: 'Item deleted successfully', item_id });
        } catch (error) {
            console.error('❌ Delete menu item error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = menuController;