const pool = require('./db');
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.send("Project Huddle API is running!");
});

const PORT = 5000;
// Test DB Connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: "Database Connected!", time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database connection failed");
    }
});
app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});