const Pool = require("pg").Pool;
require("dotenv").config();

const devConfig = {
  user: "postgres",
  password: "password", // Your local password
  host: "localhost",
  port: 5432,
  database: "project_huddle"
};

// If we are in production (Render), use the Environment Variable string.
// If we are local, use the devConfig.
const pool = new Pool(
  process.env.NODE_ENV === "production"
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Neon connection
        },
      }
    : devConfig
);

module.exports = pool;