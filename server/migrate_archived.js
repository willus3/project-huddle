const pool = require('./db');

async function runMigration() {
    try {
        await pool.query("ALTER TABLE ideas ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;");
        console.log("Migration successful: Added is_archived column.");
    } catch (err) {
        if (err.message.includes("already exists")) {
            console.log("Column already exists, skipping.");
        } else {
            console.error("Migration failed:", err);
        }
    } finally {
        // We can't easily close the pool if it's exported as a singleton without an explicit close method depending on db.js implementation,
        // but for a script it's fine to just exit or let the process die.
        process.exit();
    }
}

runMigration();
