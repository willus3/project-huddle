const pool = require('./db');

async function runMigration() {
    try {
        console.log("Starting Monthly Goals Migration...");

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS monthly_goals (
                id SERIAL PRIMARY KEY,
                team_id INTEGER REFERENCES teams(id),
                user_id INTEGER REFERENCES users(id),
                month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
                year INTEGER NOT NULL,
                goal INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, user_id, month, year)
            );
        `;

        await pool.query(createTableQuery);
        console.log("Migration successful: monthly_goals table created or already exists.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

runMigration();
