/**
 * Bootstraps the very first SUPER_ADMIN user so you have a way to log in
 * and call the RBAC/user-management endpoints for the first time.
 *
 * Usage:
 *   node scripts/seed-super-admin.js <email> <password> [firstName] [lastName]
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const [, , email, password, firstName = 'Super', lastName = 'Admin'] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/seed-super-admin.js <email> <password> [firstName] [lastName]');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`User already exists (${email}). Ensuring SUPER_ADMIN role is attached...`);
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         RETURNING id`,
        [email.toLowerCase(), passwordHash, firstName, lastName]
      );
      userId = result.rows[0].id;
      console.log(`Created user ${email}`);
    }

    const roleResult = await client.query(
      `SELECT id FROM roles WHERE code = 'SUPER_ADMIN' AND society_id IS NULL`
    );
    if (roleResult.rows.length === 0) {
      throw new Error('SUPER_ADMIN role not found. Run "npm run migrate" first.');
    }
    const roleId = roleResult.rows[0].id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id, society_id)
       VALUES ($1, $2, NULL)
       ON CONFLICT (user_id, role_id)
       DO UPDATE SET society_id = NULL`,
      [userId, roleId]
    );

    console.log(`SUPER_ADMIN role assigned to ${email}. You can now log in via POST /api/v1/auth/login.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
