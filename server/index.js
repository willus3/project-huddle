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
// ROUTE: Update Idea (PUT) - Now with Review Date
// ==========================================
app.put('/ideas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Added next_review_date to the destructured body
        const { status, impact, effort, user_id, next_review_date, is_archived } = req.body;

        const updateQuery = `
            UPDATE ideas 
            SET 
                status = COALESCE($1, status),
                impact = COALESCE($2, impact),
                effort = COALESCE($3, effort),
                assignee_id = COALESCE($4, assignee_id),
                next_review_date = COALESCE($5, next_review_date),
                is_archived = COALESCE($6, is_archived)
            WHERE id = $7 
            RETURNING *
        `;

        // Note: We added next_review_date as the 5th parameter, id is now 6th
        const updatedIdea = await pool.query(updateQuery, [status, impact, effort, user_id, next_review_date, is_archived, id]);

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
// ROUTE: Get Users (Enhanced for Admin)
// ==========================================
app.get('/users', async (req, res) => {
    try {
        const allUsers = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role, u.team_id, u.monthly_goal, t.name as team_name 
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            ORDER BY u.full_name ASC
        `);
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Create New Team
// ==========================================
app.post('/teams', async (req, res) => {
    try {
        const { name, monthly_goal } = req.body;
        const newTeam = await pool.query(
            "INSERT INTO teams (name, monthly_goal) VALUES ($1, $2) RETURNING *",
            [name, monthly_goal]
        );
        res.json(newTeam.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Create New User
// ==========================================
app.post('/users', async (req, res) => {
    try {
        const { full_name, email, password, role, team_id, monthly_goal } = req.body;

        // Default goal to 5 if not provided
        const goal = monthly_goal || 5;

        const newUser = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role, team_id, monthly_goal) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, full_name, email, role, team_id`,
            [full_name, email, password, role, team_id, goal]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Update User
// ==========================================
app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, team_id, monthly_goal } = req.body;

        await pool.query(
            `UPDATE users SET full_name = $1, email = $2, role = $3, team_id = $4, monthly_goal = $5 
             WHERE id = $6`,
            [full_name, email, role, team_id, monthly_goal, id]
        );
        res.json("User Updated");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Update Team
// ==========================================
app.put('/teams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, monthly_goal } = req.body;

        await pool.query(
            "UPDATE teams SET name = $1, monthly_goal = $2 WHERE id = $3",
            [name, monthly_goal, id]
        );
        res.json("Team Updated");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Get Company Branding (Public)
// ==========================================
app.get('/settings/branding', async (req, res) => {
    try {
        // We assume Single Tenant, so we always grab Organization ID 1
        const settings = await pool.query("SELECT name, logo_url, primary_color FROM organizations WHERE id = 1");
        res.json(settings.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Update Branding
// ==========================================
app.put('/settings/branding', async (req, res) => {
    try {
        const { name, logo_url, primary_color } = req.body;

        // Update ID 1
        const update = await pool.query(
            "UPDATE organizations SET name = $1, logo_url = $2, primary_color = $3 WHERE id = 1 RETURNING *",
            [name, logo_url, primary_color]
        );
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// NEW:
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});

