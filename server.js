require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');

// Initialize Express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());  // Enable CORS for frontend
app.use(bodyParser.json());  // Parse JSON bodies
app.use(helmet()); // Add basic security headers

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,       // Use the DB_HOST from .env
    user: process.env.DB_USER,       // Use the DB_USER from .env
    password: process.env.DB_PASSWORD,  // Use the DB_PASSWORD from .env
    database: process.env.DB_NAME    // Use the DB_NAME from .env
});

// Connect to MySQL database
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Define API Routes

// Endpoint to get active orders
app.get('/api/getOrders', (req, res) => {
    const query = 'SELECT * FROM orders';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ success: false, message: 'Error fetching orders' });
        }
        res.json({ orders: results });
    });
});

// Endpoint to get completed orders
app.get('/api/getCompletedOrders', (req, res) => {
    const query = 'SELECT * FROM completed_orders';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching completed orders:', err);
            return res.status(500).json({ success: false, message: 'Error fetching completed orders' });
        }
        res.json({ completedOrders: results });
    });
});
// Endpoint to mark an order as completed
app.post('/api/completeOrder', (req, res) => {
    const { orderId, paymentCompletedTime } = req.body;
    
    // Fetch the order details from the orders table
    const fetchOrderQuery = 'SELECT * FROM orders WHERE id = ?';
    db.query(fetchOrderQuery, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ success: false, message: 'Error fetching order' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const order = results[0];
        const { name, mobile, table_no, items, total, order_confirmation_date } = order;
        
        // Insert the order into completed_orders
        const insertQuery = 'INSERT INTO completed_orders (name, mobile, table_no, items, total, order_confirmation_date, payment_completed_time) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(insertQuery, [name, mobile, table_no, JSON.stringify(items), total, order_confirmation_date, paymentCompletedTime], (err, result) => {
            if (err) {
                console.error('Error inserting into completed_orders:', err);
                return res.status(500).json({ success: false, message: 'Error completing order' });
            }
            
            // Delete the order from orders table
            const deleteQuery = 'DELETE FROM orders WHERE id = ?';
            db.query(deleteQuery, [orderId], (err, result) => {
                if (err) {
                    console.error('Error deleting order:', err);
                    return res.status(500).json({ success: false, message: 'Error deleting order' });
                }
                res.json({ success: true, message: 'Order completed successfully' });
            });
        });
    });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
