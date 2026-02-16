const Pool = require("pg").Pool;
require("dotenv").config();

// Production (Render) uses DATABASE_URL connection string
// Development uses individual env variables
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
    : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    }
);

module.exports = pool;