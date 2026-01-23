// server/index.js
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Database connection
const app = express();

app.use(cors());
app.use(express.json());

// ROUTE 1: Create a new Idea (POST)
app.post('/ideas', async (req, res) => {
    try {
        const { title, category, impact, effort } = req.body;
        
        // Hardcoded for now (User 1, Board 1)
        const newIdea = await pool.query(
            `INSERT INTO ideas (board_id, user_id, title, category, impact, effort) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [1, 1, title, category, impact, effort]
        );

        res.json(newIdea.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ROUTE 2: Get all Ideas (GET)
app.get('/ideas', async (req, res) => {
    try {
        const allIdeas = await pool.query("SELECT * FROM ideas ORDER BY id DESC");
        res.json(allIdeas.rows);
    } catch (err) {
        console.error(err.message);
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});