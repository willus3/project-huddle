const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: true // Simplified SSL for Neon
});

async function runMigration() {
    try {
        console.log("Starting Branding Migration...");

        // Test connection
        await pool.query('SELECT NOW()');
        console.log("Connection successful.");

        // 1. Add logo_url column
        // ... (rest of the logic)
        try {
            await pool.query("ALTER TABLE organizations ADD COLUMN logo_url TEXT;");
            console.log("Added logo_url column.");
        } catch (err) {
            if (err.message.includes("already exists")) {
                console.log("logo_url column already exists.");
            } else {
                throw err;
            }
        }

        // 2. Add primary_color column
        try {
            await pool.query("ALTER TABLE organizations ADD COLUMN primary_color VARCHAR(50);");
            console.log("Added primary_color column.");
        } catch (err) {
            if (err.message.includes("already exists")) {
                console.log("primary_color column already exists.");
            } else {
                throw err;
            }
        }

        // 3. Ensure Organization ID 1 exists
        const orgCheck = await pool.query("SELECT id FROM organizations WHERE id = 1");
        if (orgCheck.rows.length === 0) {
            await pool.query("INSERT INTO organizations (id, name, primary_color) VALUES (1, 'Project Huddle', '#2563EB')");
            console.log("Created default organization row with ID 1.");
        } else {
            console.log("Organization row with ID 1 already exists.");
        }

        console.log("Migration complete!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

runMigration();
