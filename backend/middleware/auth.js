const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [users] = await pool.execute(
            'SELECT user_id, email, full_name, user_type FROM users WHERE user_id = ? AND is_active = TRUE',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            user_id: users[0].user_id,
            email: users[0].email,
            full_name: users[0].full_name,
            user_type: users[0].user_type
        };
        
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.user_type)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
};

module.exports = { authenticateToken, requireRole };