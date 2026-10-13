require("dotenv").config({ path: require("node:path").join(__dirname, "../.env"), quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Client } = require("pg");
const folder = path.join(__dirname, "../migrations");
const files = fs.readdirSync(folder).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort();
const migrations = files.map(name => {
    const sql = fs.readFileSync(path.join(folder, name), "utf8").replace(/^\uFEFF/, "");
    return { name, sql, checksum: crypto.createHash("sha256").update(sql).digest("hex") };
});
async function main() {
    const mode = process.argv[2] || "up";
    if (!["up", "status", "check"].includes(mode)) throw new Error("Usage: node scripts/migrate.js [up|status|check]");
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 10000
    });
    let locked = false;
    try {
        await client.connect();
        // Session lock prevents concurrent runners; transactions use the same connection.
        await client.query("SELECT pg_advisory_lock(734921, 1)");
        locked = true;
        const exists = await client.query("SELECT to_regclass('public.schema_migrations') AS name");
        if (mode === "up") await client.query(
            "CREATE TABLE IF NOT EXISTS public.schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
        );
        const history = (mode === "up" || exists.rows[0].name)
            ? (await client.query("SELECT name, checksum FROM public.schema_migrations ORDER BY name")).rows : [];
        for (const row of history) {
            const migration = migrations.find(m => m.name === row.name);
            if (!migration || migration.checksum !== row.checksum) throw new Error("Missing or modified applied migration: " + row.name);
        }
        const applied = new Set(history.map(row => row.name));
        const pending = migrations.filter(m => !applied.has(m.name));
        if (mode === "status") {
            for (const m of migrations) console.log((applied.has(m.name) ? "APPLIED " : "PENDING ") + m.name);
            return;
        }
        if (mode === "check") {
            if (pending.length) throw new Error("Pending migrations: " + pending.map(m => m.name).join(", "));
            console.log("Database migrations are current.");
            return;
        }
        for (const m of pending) {
            await client.query("BEGIN");
            try {
                await client.query("SET LOCAL search_path TO public");
                await client.query(m.sql);
                await client.query("INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)", [m.name, m.checksum]);
                await client.query("COMMIT");
                console.log("Applied " + m.name);
            } catch (error) {
                await client.query("ROLLBACK");
                throw new Error(m.name + " failed: " + error.message);
            }
        }
        if (!pending.length) console.log("No pending migrations.");
    } finally {
        if (locked) await client.query("SELECT pg_advisory_unlock(734921, 1)").catch(() => {});
        await client.end();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
