const { pool } = require('../config/database');

const orderController = {
    placeOrder: async (req, res) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const { restaurant_id, items, delivery_location, special_instructions, payment_method } = req.body;
            const student_id = req.user.user_id;

            console.log('📦 Placing order:', { student_id, restaurant_id, items });

            if (!items || items.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Order must contain at least one item' });
            }

            // Validate items and calculate total
            let totalAmount = 0;
            const validatedItems = [];

            for (const item of items) {
                const [menuItems] = await connection.execute(
                    `SELECT mi.item_id, mi.item_name, mi.price, mi.current_stock, mi.is_available, 
                            mi.restaurant_id, r.restaurant_name
                     FROM menu_items mi
                     JOIN restaurants r ON mi.restaurant_id = r.restaurant_id
                     WHERE mi.item_id = ? AND r.is_open = TRUE`,
                    [item.item_id]
                );

                if (menuItems.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ error: `Item ${item.item_id} not found or restaurant is closed` });
                }

                const menuItem = menuItems[0];

                if (menuItem.restaurant_id != restaurant_id) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ error: `Item ${menuItem.item_name} belongs to different restaurant` });
                }

                if (!menuItem.is_available) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ error: `Item ${menuItem.item_name} is not available` });
                }

                if (menuItem.current_stock < item.quantity) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ 
                        error: `Insufficient stock for ${menuItem.item_name}. Available: ${menuItem.current_stock}, Requested: ${item.quantity}` 
                    });
                }

                const itemTotal = menuItem.price * item.quantity;
                totalAmount += itemTotal;

                validatedItems.push({
                    ...item,
                    price: menuItem.price,
                    item_name: menuItem.item_name,
                    current_stock: menuItem.current_stock
                });
            }

            console.log(' Items validated. Total:', totalAmount);

            // Create order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (student_id, restaurant_id, total_amount, delivery_location, special_instructions)
                 VALUES (?, ?, ?, ?, ?)`,
                [student_id, restaurant_id, totalAmount, delivery_location, special_instructions || '']
            );

            const orderId = orderResult.insertId;
            console.log(' Order created with ID:', orderId);

            // Add order items and update inventory
            for (const item of validatedItems) {
                const subtotal = item.price * item.quantity;
                
                // Add order item
                await connection.execute(
                    `INSERT INTO order_items (order_id, item_id, quantity, price_at_order, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.item_id, item.quantity, item.price, subtotal]
                );

                const newStock = item.current_stock - item.quantity;
                const isAvailable = newStock > 0;
                
                await connection.execute(
                    `UPDATE menu_items 
                     SET current_stock = ?, 
                         is_available = ?,
                         updated_at = CURRENT_TIMESTAMP 
                     WHERE item_id = ?`,
                    [newStock, isAvailable, item.item_id]
                );

                console.log(`Stock updated for item ${item.item_id}: ${item.current_stock} → ${newStock}`);

                // Log inventory change
                await connection.execute(
                    `INSERT INTO inventory_logs (item_id, change_type, quantity_change, previous_stock, new_stock, reason, changed_by)
                     VALUES (?, 'sale', ?, ?, ?, ?, ?)`,
                    [item.item_id, -item.quantity, item.current_stock, newStock, `Order #${orderId}`, student_id]
                );
            }

            // Create payment record
            await connection.execute(
                `INSERT INTO payments (order_id, amount, payment_method, payment_status)
                 VALUES (?, ?, ?, 'pending')`,
                [orderId, totalAmount, payment_method || 'cash']
            );

            await connection.commit();
            connection.release();

            console.log('Order placed successfully!');

            res.status(201).json({
                message: 'Order placed successfully',
                order_id: orderId,
                total_amount: totalAmount,
                items: validatedItems.map(item => ({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                }))
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error(' Place order error:', error);
            res.status(500).json({ error: 'Failed to place order: ' + error.message });
        }
    },

    // Get customer orders
    getCustomerOrders: async (req, res) => {
        try {
            const student_id = req.user.user_id;

            const [orders] = await pool.execute(`
                SELECT 
                    o.*,
                    r.restaurant_name,
                    r.location as restaurant_location
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.restaurant_id
                WHERE o.student_id = ?
                ORDER BY o.order_date DESC
            `, [student_id]);

            res.json({ orders });
        } catch (error) {
            console.error('Get customer orders error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get vendor orders
    getVendorOrders: async (req, res) => {
        try {
            const vendor_id = req.user.user_id;
            console.log('Loading orders for vendor:', vendor_id);

            const [orders] = await pool.execute(`
                SELECT 
                    o.*,
                    r.restaurant_name,
                    u.full_name as student_name,
                    u.phone as student_phone
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.restaurant_id
                JOIN users u ON o.student_id = u.user_id
                WHERE r.vendor_id = ?
                ORDER BY o.order_date DESC
                LIMIT 50
            `, [vendor_id]);

            console.log(` Found ${orders.length} orders for vendor ${vendor_id}`);
            res.json({ orders });
        } catch (error) {
            console.error('Get vendor orders error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { order_id } = req.params;
            const { order_status } = req.body;
            const vendor_id = req.user.user_id;

            const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
            if (!validStatuses.includes(order_status)) {
                return res.status(400).json({ error: 'Invalid order status' });
            }

            // Verify vendor owns this order's restaurant
            const [orders] = await pool.execute(`
                SELECT o.order_id 
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.restaurant_id
                WHERE o.order_id = ? AND r.vendor_id = ?
            `, [order_id, vendor_id]);

            if (orders.length === 0) {
                return res.status(404).json({ error: 'Order not found or access denied' });
            }

            await pool.execute(
                'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
                [order_status, order_id]
            );

            console.log(`✅ Order ${order_id} status updated to: ${order_status}`);
            res.json({ 
                message: 'Order status updated successfully',
                order_id,
                order_status 
            });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get order details
    getOrderDetails: async (req, res) => {
        try {
            const { order_id } = req.params;
            const user = req.user;

            let query = `
                SELECT 
                    o.*,
                    r.restaurant_name,
                    r.location as restaurant_location,
                    u.full_name as student_name,
                    u.phone as student_phone
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.restaurant_id
                JOIN users u ON o.student_id = u.user_id
                WHERE o.order_id = ?
            `;

            let params = [order_id];

            if (user.user_type === 'student') {
                query += ' AND o.student_id = ?';
                params.push(user.user_id);
            } else if (user.user_type === 'vendor') {
                query += ' AND r.vendor_id = ?';
                params.push(user.user_id);
            }

            const [orders] = await pool.execute(query, params);

            if (orders.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = orders[0];

            // Get order items
            const [items] = await pool.execute(`
                SELECT 
                    oi.*,
                    mi.item_name,
                    mi.description
                FROM order_items oi
                JOIN menu_items mi ON oi.item_id = mi.item_id
                WHERE oi.order_id = ?
            `, [order_id]);

            res.json({ 
                order,
                items 
            });
        } catch (error) {
            console.error('Get order details error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = orderController;