const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);


app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CampusCart API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log(` CampusCart Server Started Successfully!`);
            console.log('='.repeat(60));
            console.log(` Port: ${PORT}`);
            console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(` API URL: http://localhost:${PORT}/api`);
            console.log(` Health Check: http://localhost:${PORT}/api/health`);
            console.log(` Inventory Management: ENABLED`);
            console.log(` Authentication: JWT`);
            console.log('='.repeat(60));
        });
    } catch (error) {
        console.error(' Failed to start server:', error);
        process.exit(1);
    }
};

startServer();