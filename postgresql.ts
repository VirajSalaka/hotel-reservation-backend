import { Pool, PoolClient } from "pg";

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Database connection details
const pool = new Pool({
  user: "avnadmin",
  host: "pg-b3127d1c-180f-4696-9aca-90bc5224d4d8-hotelre2934851480-chore.a.aivencloud.com",
  database: "defaultdb",
  password: "AVNS_4E7YG8q89EZ0HR2cbFE",
  port: 26075,
  ssl: {
    // SSL options
    rejectUnauthorized: false, // Set to true if you want to enforce SSL verification
  },
});

// Function to acquire a client from the pool
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// Export the pool for direct query execution if needed
export default pool;
