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
        const { teamId, month, year } = req.query;

        // Base Query: Get Idea + User Name + Team Name + A3 Progress + Assignee Name
        let queryText = `
            SELECT i.*, 
                   u.full_name, 
                   u.team_id, 
                   t.name as team_name,
                   ua.full_name as assignee_name,
            CASE 
                WHEN a.id IS NULL THEN NULL 
                ELSE (
                    (CASE WHEN (a.background IS NOT NULL AND a.background <> '') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.current_condition IS NOT NULL AND a.current_condition <> '') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.target_condition IS NOT NULL AND a.target_condition <> '') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.root_cause_analysis IS NOT NULL AND a.root_cause_analysis::text <> '{"five_whys": ["", "", "", "", ""], "fishbone": {}}') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.countermeasures IS NOT NULL AND a.countermeasures <> '') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.implementation_plan IS NOT NULL AND a.implementation_plan <> '[]') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.effect_confirmation IS NOT NULL AND a.effect_confirmation <> '') THEN 1 ELSE 0 END) +
                    (CASE WHEN (a.standardization IS NOT NULL AND a.standardization <> '') THEN 1 ELSE 0 END)
                ) * 100 / 8
            END as a3_progress
            FROM ideas i
            LEFT JOIN users u ON i.submitter_id = u.id
            LEFT JOIN users ua ON i.assignee_id = ua.id
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN a3_worksheets a ON i.id = a.idea_id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramIndex = 1;

        // Apply Filter if teamId is present and not 'all'
        if (teamId && teamId !== 'all') {
            queryText += ` AND u.team_id = $${paramIndex++}`;
            queryParams.push(parseInt(teamId));
        }

        // Apply Month/Year Date Filter
        if (month && year) {
            queryText += ` AND EXTRACT(MONTH FROM i.created_at) = $${paramIndex++} AND EXTRACT(YEAR FROM i.created_at) = $${paramIndex++}`;
            queryParams.push(parseInt(month), parseInt(year));
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
// ROUTE: Update Idea (PUT) - Support Full Editing
// ==========================================
app.put('/ideas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status, impact, effort, user_id, next_review_date, is_archived,
            title, category, problem_statement, proposed_solution, expected_benefit
        } = req.body;

        const updateQuery = `
            UPDATE ideas 
            SET 
                status = COALESCE($1, status),
                impact = COALESCE($2, impact),
                effort = COALESCE($3, effort),
                assignee_id = COALESCE($4, assignee_id),
                next_review_date = COALESCE($5, next_review_date),
                is_archived = COALESCE($6, is_archived),
                title = COALESCE($7, title),
                category = COALESCE($8, category),
                problem_statement = COALESCE($9, problem_statement),
                proposed_solution = COALESCE($10, proposed_solution),
                expected_benefit = COALESCE($11, expected_benefit),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12 
            RETURNING *
        `;

        const updatedIdea = await pool.query(updateQuery, [
            status, impact, effort, user_id, next_review_date, is_archived,
            title, category, problem_statement, proposed_solution, expected_benefit,
            id
        ]);

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
// ROUTE: Company Stats / Team Cards (Historical Support)
// ==========================================
app.get('/stats/company', async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const query = `
            SELECT 
                t.id, 
                t.name, 
                COALESCE(mg.goal, t.monthly_goal) as monthly_goal,
                -- Count Submissions
                COALESCE((SELECT COUNT(*) 
                 FROM ideas i 
                 JOIN users u ON i.submitter_id = u.id 
                 WHERE u.team_id = t.id 
                 AND EXTRACT(MONTH FROM i.created_at) = $1
                 AND EXTRACT(YEAR FROM i.created_at) = $2
                ), 0)::int as submissions,
                -- Count Completions
                COALESCE((SELECT COUNT(*) 
                 FROM ideas i 
                 JOIN users u ON i.submitter_id = u.id 
                 WHERE u.team_id = t.id 
                 AND i.status = 'Completed'
                 AND EXTRACT(MONTH FROM i.updated_at) = $1
                 AND EXTRACT(YEAR FROM i.updated_at) = $2
                ), 0)::int as completions
            FROM teams t
            LEFT JOIN monthly_goals mg ON t.id = mg.team_id AND mg.user_id IS NULL AND mg.month = $1 AND mg.year = $2
            ORDER BY submissions DESC;
        `;

        const companyStats = await pool.query(query, [targetMonth, targetYear]);
        res.json(companyStats.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Single Team Stats (Historical Support)
// ==========================================
app.get('/stats/:team_id', async (req, res) => {
    try {
        const { team_id } = req.params;
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        // 1. Get Team Details & Goal
        const teamInfo = await pool.query(`
            SELECT t.name, COALESCE(mg.goal, t.monthly_goal) as monthly_goal 
            FROM teams t 
            LEFT JOIN monthly_goals mg ON t.id = mg.team_id AND mg.user_id IS NULL AND mg.month = $2 AND mg.year = $3
            WHERE t.id = $1`, [team_id, targetMonth, targetYear]);

        // 2. Count Team Ideas
        const teamCount = await pool.query(
            `SELECT COUNT(*) FROM ideas 
             JOIN users ON ideas.submitter_id = users.id
             WHERE users.team_id = $1 
             AND EXTRACT(MONTH FROM ideas.created_at) = $2
             AND EXTRACT(YEAR FROM ideas.created_at) = $3`
            , [team_id, targetMonth, targetYear]
        );

        // 3. Get User Stats
        const userStats = await pool.query(
            `SELECT users.id, users.full_name, COALESCE(mg.goal, users.monthly_goal) as monthly_goal, COUNT(ideas.id) as actual
             FROM users
             LEFT JOIN ideas ON users.id = ideas.submitter_id 
             AND EXTRACT(MONTH FROM ideas.created_at) = $2
             AND EXTRACT(YEAR FROM ideas.created_at) = $3
             LEFT JOIN monthly_goals mg ON users.id = mg.user_id AND mg.month = $2 AND mg.year = $3
             WHERE users.team_id = $1
             GROUP BY users.id, mg.goal`
            , [team_id, targetMonth, targetYear]
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
// ROUTE: Annual Company Stats
// ==========================================
app.get('/stats/company/annual', async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const query = `
            WITH months AS (
                SELECT generate_series(1, 12) AS month
            )
            SELECT 
                m.month,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM ideas i
                    WHERE EXTRACT(MONTH FROM i.created_at) = m.month 
                    AND EXTRACT(YEAR FROM i.created_at) = $1
                ), 0)::int as actual,
                COALESCE((
                    SELECT SUM(target_goal) FROM (
                        SELECT COALESCE(mg.goal, t.monthly_goal) as target_goal
                        FROM teams t
                        LEFT JOIN monthly_goals mg ON t.id = mg.team_id AND mg.user_id IS NULL AND mg.month = m.month AND mg.year = $1
                    ) as team_goals
                ), 0)::int as goal
            FROM months m
            ORDER BY m.month;
        `;

        const annualStats = await pool.query(query, [targetYear]);
        res.json(annualStats.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ROUTE: Annual Team Stats
// ==========================================
app.get('/stats/:team_id/annual', async (req, res) => {
    try {
        const { team_id } = req.params;
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const query = `
            WITH months AS (
                SELECT generate_series(1, 12) AS month
            )
            SELECT 
                m.month,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM ideas i
                    JOIN users u ON i.submitter_id = u.id
                    WHERE u.team_id = $1 
                    AND EXTRACT(MONTH FROM i.created_at) = m.month 
                    AND EXTRACT(YEAR FROM i.created_at) = $2
                ), 0)::int as actual,
                COALESCE(mg.goal, t.monthly_goal) as goal
            FROM months m
            JOIN teams t ON t.id = $1
            LEFT JOIN monthly_goals mg ON t.id = mg.team_id AND mg.user_id IS NULL AND mg.month = m.month AND mg.year = $2
            ORDER BY m.month;
        `;

        const annualStats = await pool.query(query, [team_id, targetYear]);
        res.json(annualStats.rows);
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

        if (settings.rows.length === 0) {
            // Return defaults if row doesn't exist yet
            return res.json({
                name: "Project Huddle",
                logo_url: "",
                primary_color: "#2563EB"
            });
        }
        res.json(settings.rows[0]);
    } catch (err) {
        console.error("GET Branding Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// ADMIN ROUTE: Update Branding (With Upsert)
// ==========================================
app.put('/settings/branding', async (req, res) => {
    try {
        const { name, logo_url, primary_color } = req.body;

        const query = `
            INSERT INTO organizations (id, name, logo_url, primary_color)
            VALUES (1, $1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                logo_url = EXCLUDED.logo_url,
                primary_color = EXCLUDED.primary_color
            RETURNING *;
        `;

        const update = await pool.query(query, [name, logo_url, primary_color]);
        res.json(update.rows[0]);
    } catch (err) {
        console.error("PUT Branding Error:", err.message);
        res.status(500).send("Server Error");
    }
});


// ==========================================
// A3 WORKSHEET ROUTES (PRO TIER)
// ==========================================

// GET A3 by Idea ID
app.get('/a3/:idea_id', async (req, res) => {
    try {
        const { idea_id } = req.params;
        const a3 = await pool.query("SELECT * FROM a3_worksheets WHERE idea_id = $1", [idea_id]);

        if (a3.rows.length === 0) {
            return res.status(404).json(null); // Not found is okay, means we haven't started one yet
        }
        res.json(a3.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// CREATE A3 (Initialize or Full Save)
app.post('/a3', async (req, res) => {
    try {
        const {
            idea_id, background, current_condition, target_condition,
            root_cause_analysis, countermeasures, implementation_plan,
            effect_confirmation, standardization, status
        } = req.body;

        // Check if exists first
        const check = await pool.query("SELECT * FROM a3_worksheets WHERE idea_id = $1", [idea_id]);
        if (check.rows.length > 0) {
            // If it exists but we called POST, let's treat it as a PUT or return existing. 
            // Better to fail or return existing so frontend switches to PUT.
            return res.json(check.rows[0]);
        }

        const newA3 = await pool.query(
            `INSERT INTO a3_worksheets (
                idea_id, background, current_condition, target_condition,
                root_cause_analysis, countermeasures, implementation_plan,
                effect_confirmation, standardization, status
            ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                idea_id, background, current_condition, target_condition,
                root_cause_analysis, countermeasures, implementation_plan,
                effect_confirmation, standardization, status || "Draft"
            ]
        );
        res.json(newA3.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// UPDATE A3
app.put('/a3/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            background, current_condition, target_condition,
            root_cause_analysis, countermeasures, implementation_plan,
            effect_confirmation, standardization, status
        } = req.body;

        const updatedA3 = await pool.query(
            `UPDATE a3_worksheets SET 
                background = COALESCE($1, background),
                current_condition = COALESCE($2, current_condition),
                target_condition = COALESCE($3, target_condition),
                root_cause_analysis = COALESCE($4, root_cause_analysis),
                countermeasures = COALESCE($5, countermeasures),
                implementation_plan = COALESCE($6, implementation_plan),
                effect_confirmation = COALESCE($7, effect_confirmation),
                standardization = COALESCE($8, standardization),
                status = COALESCE($9, status),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 
             RETURNING *`,
            [background, current_condition, target_condition, root_cause_analysis,
                countermeasures, implementation_plan, effect_confirmation, standardization, status, id]
        );

        res.json(updatedA3.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});

