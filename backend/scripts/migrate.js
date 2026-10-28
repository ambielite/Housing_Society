const path = require("node:path");
const envFile = process.env.NODE_ENV === "test" ? "../.env.test" : "../.env";
require("dotenv").config({
    path: path.join(__dirname, envFile),
    override: process.env.NODE_ENV === "test",
    quiet: true,
});
const fs = require("node:fs");
const crypto = require("node:crypto");
const { Client } = require("pg");

const migrationsRoot = path.join(__dirname, "../migrations");

function readMigrations() {
    const rootFiles = fs.readdirSync(migrationsRoot)
        .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
        .map((name) => ({ name, file: path.join(migrationsRoot, name) }));

    const sujalFolder = path.join(migrationsRoot, "sujal");
    const sujalFiles = fs.readdirSync(sujalFolder)
        .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
        .map((name) => ({ name: `sujal/${name}`, file: path.join(sujalFolder, name) }));

    return [...rootFiles, ...sujalFiles].sort((a, b) => a.name.localeCompare(b.name)).map(({ name, file }) => {
        const sql = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
        // Older versions of the root migrations omitted the statement
        // terminator on CREATE INDEX lines. Accept those exact historical
        // checksums so fixing the SQL does not make an applied migration look
        // edited. New applications are recorded with the corrected checksum.
        const legacySql = sql.split("\n").map((line) =>
            line.replace(/^(\s*CREATE\s+(?:UNIQUE\s+)?INDEX\b.*);[ \t]*(\r?)$/i, "$1$2")
        ).join("\n");
        const checksum = crypto.createHash("sha256").update(sql).digest("hex");
        const normalizedChecksum = crypto.createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
        const legacyChecksum = crypto.createHash("sha256").update(legacySql).digest("hex");
        const legacyNormalizedChecksum = crypto.createHash("sha256").update(legacySql.replace(/\r\n/g, "\n")).digest("hex");
        // 039 was applied before its billing-cycle FK was moved to migration
        // 040. Keep its recorded checksum valid while the new migration adds
        // that relationship without rewriting applied migration history.
        const knownHistoricalChecksums = name === "sujal/039_link_asset_categories_and_finance.sql"
            ? ["ccc08cef51e92082b0cb17f67688079032fd30738a0ea63ddbf53ca7a541bd6b"]
            : name === "0104_create_other_income_entries.sql"
                ? ["913d165bc17d4c0b4f50f95f4f2c12a2ec0c7fad980db9b14641cd331c446109"]
                : [];
        return {
            name,
            sql,
            checksum,
            // Git checkouts may convert SQL line endings, so allow both forms
            // while validating previously recorded checksums.
            acceptedChecksums: new Set([checksum, normalizedChecksum, legacyChecksum, legacyNormalizedChecksum, ...knownHistoricalChecksums]),
        };
    });
}

function matchMigration(name, migrations) {
    const exact = migrations.find((migration) => migration.name === name);
    if (exact) return exact;
    const basenameMatches = migrations.filter((migration) => path.posix.basename(migration.name) === name);
    return basenameMatches.length === 1 ? basenameMatches[0] : null;
}

async function readLegacyHistory(client, migrations) {
    const table = await client.query("SELECT to_regclass('public.schema_migrations') AS name");
    if (!table.rows[0].name) return [];

    const columns = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schema_migrations'"
    );
    const names = new Set(columns.rows.map((row) => row.column_name));

    if (names.has("name") && names.has("checksum")) {
        return (await client.query("SELECT name, checksum FROM public.schema_migrations ORDER BY name")).rows.map((row) => {
            const migration = matchMigration(row.name, migrations);
            if (!migration) throw new Error(`Unknown migration in existing schema_migrations history: ${row.name}`);
            if (row.checksum && !migration.acceptedChecksums.has(row.checksum)) {
                throw new Error(`Applied migration has changed: ${row.name}`);
            }
            return { name: migration.name, checksum: migration.checksum };
        });
    }

    if (names.has("filename")) {
        return (await client.query("SELECT filename FROM public.schema_migrations ORDER BY filename")).rows.map((row) => {
            const migration = matchMigration(row.filename, migrations);
            if (!migration) throw new Error(`Unknown legacy migration in schema_migrations history: ${row.filename}`);
            return { name: migration.name, checksum: migration.checksum };
        });
    }

    throw new Error("The existing public.schema_migrations table has an unsupported layout.");
}

async function main() {
    const mode = process.argv[2] || "up";
    if (!["up", "status", "check"].includes(mode)) throw new Error("Usage: node scripts/migrate.js [up|status|check]");

    const migrations = readMigrations();
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 10000,
    });

    let locked = false;
    try {
        await client.connect();
        await client.query("SELECT pg_advisory_lock(734921, 1)");
        locked = true;

        const legacy = await readLegacyHistory(client, migrations);
        const trackerExists = await client.query("SELECT to_regclass('public.integration_schema_migrations') AS name");
        if (mode === "up") {
            await client.query(`
                CREATE TABLE IF NOT EXISTS public.integration_schema_migrations (
                    name TEXT PRIMARY KEY,
                    checksum TEXT NOT NULL,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            for (const row of legacy) {
                await client.query(
                    "INSERT INTO public.integration_schema_migrations (name, checksum) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
                    [row.name, row.checksum]
                );
            }
        }

        const integrated = trackerExists.rows[0].name
            ? (await client.query("SELECT name, checksum FROM public.integration_schema_migrations ORDER BY name")).rows
            : [];
        const historyByName = new Map([...legacy, ...integrated].map((row) => [row.name, row]));

        for (const row of historyByName.values()) {
            const migration = migrations.find((item) => item.name === row.name);
            if (!migration || !migration.acceptedChecksums.has(row.checksum)) {
                throw new Error(`Missing or modified applied migration: ${row.name}`);
            }
        }

        const applied = new Set(historyByName.keys());
        const pending = migrations.filter((migration) => !applied.has(migration.name));
        if (mode === "status") {
            for (const migration of migrations) console.log(`${applied.has(migration.name) ? "APPLIED " : "PENDING "}${migration.name}`);
            return;
        }
        if (mode === "check") {
            if (pending.length) throw new Error(`Pending migrations: ${pending.map((migration) => migration.name).join(", ")}`);
            console.log("Database migrations are current.");
            return;
        }

        for (const migration of pending) {
            await client.query("BEGIN");
            try {
                await client.query("SET LOCAL search_path TO public");
                await client.query(migration.sql);
                await client.query(
                    "INSERT INTO public.integration_schema_migrations (name, checksum) VALUES ($1, $2)",
                    [migration.name, migration.checksum]
                );
                await client.query("COMMIT");
                console.log(`Applied ${migration.name}`);
            } catch (error) {
                await client.query("ROLLBACK");
                throw new Error(`${migration.name} failed: ${error.message}`);
            }
        }
        if (!pending.length) console.log("No pending migrations.");
    } finally {
        if (locked) await client.query("SELECT pg_advisory_unlock(734921, 1)").catch(() => {});
        await client.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
