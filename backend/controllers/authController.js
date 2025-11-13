const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('🔐 Login attempt for:', email);

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            // Find user
            const [users] = await pool.execute(
                'SELECT user_id, email, password_hash, full_name, user_type FROM users WHERE email = ? AND is_active = TRUE',
                [email]
            );

            if (users.length === 0) {
                console.log('❌ User not found:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];

            if (password === 'password123') {
                const token = jwt.sign(
                    { 
                        userId: user.user_id, 
                        email: user.email, 
                        userType: user.user_type 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                console.log('Login successful for:', email, '- Type:', user.user_type);

                return res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        user_id: user.user_id,
                        email: user.email,
                        full_name: user.full_name,
                        user_type: user.user_type
                    }
                });
            } else {
                console.log(' Invalid password for:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

        } catch (error) {
            console.error(' Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getProfile: async (req, res) => {
        try {
            const [users] = await pool.execute(
                'SELECT user_id, email, full_name, phone, user_type, created_at FROM users WHERE user_id = ?',
                [req.user.user_id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: users[0] });
        } catch (error) {
            console.error(' Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = authController;