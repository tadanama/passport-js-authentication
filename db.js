import pg from "pg";
const { Pool } = pg;
import env from "dotenv";

// Allow the use of environment variables
env.config();

// Configure postgres pool connection
const pool = new Pool({
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT,
	max: 20,    //  20 pool connection to query to the database
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

export default pool;
