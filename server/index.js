// server/index.js
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// ROUTE: Create Idea (POST)
// ==========================================
app.post('/ideas', async (req, res) => {
    try {
        const { 
            title, category, impact, effort, timeline, submitter_id,
            problem_statement, proposed_solution, expected_benefit 
        } = req.body;

        const finalTimeline = timeline || 'New'; 
        const finalSubmitter = submitter_id || 1; 

        const newIdea = await pool.query(
            `INSERT INTO ideas (
                board_id, submitter_id, title, category, impact, effort, status,
                problem_statement, proposed_solution, expected_benefit
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                1, finalSubmitter, title, category, impact, effort, finalTimeline,
                problem_statement, proposed_solution, expected_benefit
            ]
        );
        res.json(newIdea.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Get Ideas (GET) - With Filtering
// ==========================================
app.get('/ideas', async (req, res) => {
    try {
        // Check if there is a team filter (e.g., /ideas?teamId=1)
        const { teamId } = req.query;

        // Base Query: Get Idea + User Name + Team Name
        let queryText = `
            SELECT i.*, u.full_name, u.team_id, t.name as team_name 
            FROM ideas i
            LEFT JOIN users u ON i.submitter_id = u.id
            LEFT JOIN teams t ON u.team_id = t.id
        `;
        
        const queryParams = [];

        // Apply Filter if teamId is present and not 'all'
        if (teamId && teamId !== 'all') {
            queryText += ` WHERE u.team_id = $1`;
            queryParams.push(parseInt(teamId));
        }

        queryText += ` ORDER BY i.id DESC`;

        const allIdeas = await pool.query(queryText, queryParams);
        res.json(allIdeas.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Update Idea (PUT)
// ==========================================
app.put('/ideas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, impact, effort, user_id } = req.body;

        const updateQuery = `
            UPDATE ideas 
            SET 
                status = COALESCE($1, status),
                impact = COALESCE($2, impact),
                effort = COALESCE($3, effort),
                assignee_id = COALESCE($4, assignee_id)
            WHERE id = $5 
            RETURNING *
        `;

        const updatedIdea = await pool.query(updateQuery, [status, impact, effort, user_id, id]);

        if (updatedIdea.rows.length === 0) {
            return res.status(404).json({ message: "Idea not found" });
        }

        res.json(updatedIdea.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Login
// ==========================================
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            return res.status(401).json("User not found");
        }

        if (user.rows[0].password_hash !== password) {
            return res.status(401).json("Incorrect password");
        }

        const validUser = user.rows[0];
        delete validUser.password_hash; 
        
        res.json(validUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Company Stats / Team Cards (The Fix for Zeros)
// ==========================================
app.get('/stats/company', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id, 
                t.name, 
                t.monthly_goal,
                -- Count Submissions (Created this month)
                COALESCE((SELECT COUNT(*) 
                 FROM ideas i 
                 JOIN users u ON i.submitter_id = u.id 
                 WHERE u.team_id = t.id 
                 AND date_trunc('month', i.created_at) = date_trunc('month', CURRENT_DATE)
                ), 0)::int as submissions,
                -- Count Completions (Status 'Completed' & Updated this month)
                COALESCE((SELECT COUNT(*) 
                 FROM ideas i 
                 JOIN users u ON i.submitter_id = u.id 
                 WHERE u.team_id = t.id 
                 AND i.status = 'Completed'
                 AND date_trunc('month', i.updated_at) = date_trunc('month', CURRENT_DATE)
                ), 0)::int as completions
            FROM teams t
            ORDER BY t.name ASC;
        `;
        
        const companyStats = await pool.query(query);
        res.json(companyStats.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Single Team Stats
// ==========================================
app.get('/stats/:team_id', async (req, res) => {
    try {
        const { team_id } = req.params;

        // 1. Get Team Details
        const teamInfo = await pool.query("SELECT name, monthly_goal FROM teams WHERE id = $1", [team_id]);

        // 2. Count Team Ideas
        const teamCount = await pool.query(
            `SELECT COUNT(*) FROM ideas 
             JOIN users ON ideas.submitter_id = users.id
             WHERE users.team_id = $1 
             AND date_trunc('month', ideas.created_at) = date_trunc('month', CURRENT_DATE)`
            , [team_id]
        );

        // 3. Get User Stats
        const userStats = await pool.query(
            `SELECT users.full_name, users.monthly_goal, COUNT(ideas.id) as actual
             FROM users
             LEFT JOIN ideas ON users.id = ideas.submitter_id 
             AND date_trunc('month', ideas.created_at) = date_trunc('month', CURRENT_DATE)
             WHERE users.team_id = $1
             GROUP BY users.id`
            , [team_id]
        );

        res.json({
            team: teamInfo.rows[0],
            teamActual: parseInt(teamCount.rows[0].count),
            users: userStats.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Update Goal
// ==========================================
app.put('/teams/:id/goal', async (req, res) => {
    try {
        const { id } = req.params;
        const { goal } = req.body;
        await pool.query("UPDATE teams SET monthly_goal = $1 WHERE id = $2", [goal, id]);
        res.json("Updated");
    } catch (err) {
        console.error(err.message);
    }
});

// ==========================================
// ROUTE: Get Users (Needed for Frontend)
// ==========================================
app.get('/users', async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT id, full_name, team_id, role, monthly_goal FROM users ORDER BY full_name ASC");
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});