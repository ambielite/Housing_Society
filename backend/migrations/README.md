# PostgreSQL SQL migrations

Requires PostgreSQL 13+ and the existing backend .env variables: DB_HOST, DB_PORT,
DB_NAME, DB_USER, DB_PASSWORD. Run commands from the backend directory.

- npm run db:status: inspect applied and pending migrations without changing schema.
- npm run db:migrate: apply pending SQL files in filename order.
- npm run db:check: fail when migrations are pending or applied files were modified.

The numbered SQL files are a snapshot of the 88 currently registered
Sequelize models, including enums, SQL UUID defaults, keys, and model indexes.
The runner records SHA-256 checksums in public.schema_migrations, locks concurrent
runners, and commits each SQL file and its history record in one transaction.

## New database

Create an empty database and set DB_NAME in backend/.env. Run npm run db:migrate,
then npm run db:check, then start the backend. Server startup no longer alters tables.
The application expects tables in the public schema.

## Existing database created with Sequelize sync

Do not apply the initial migration directly over existing application tables.
It deliberately fails instead of silently accepting potentially different tables.
Back up the database first. Verify this snapshot against a separate empty database
and compare the existing schema before planning adoption and data transfer.
No automatic baseline or destructive rollback command is provided.

## Future changes

Add 0090_descriptive_name.sql, 0091_descriptive_name.sql, etc. with explicit
PostgreSQL ALTER/CREATE statements. Update Sequelize models to match. Do not edit
applied files, add BEGIN/COMMIT, or use CREATE INDEX CONCURRENTLY inside these files;
the runner supplies transaction boundaries. Use a new migration to correct a change.

scripts/generate-initial-migration.js was used offline to create the snapshot.
It never connects to a database and refuses to overwrite existing generated files.
UUIDV4 defaults are also supplied in SQL; timestamp and other JavaScript-generated
defaults still follow the models and may need explicit values for direct SQL inserts.

## File layout

0001_create_access_assignments.sql through 0088_create_work_orders.sql each
contain one table, its enum types and its indexes.
0089_add_foreign_keys.sql adds all relationships after every table exists,
including circular references. The runner applies files in numeric order.

This split replaces the earlier, unapplied 0001_initial_schema.sql snapshot.
If you already applied that old file, do not apply these files or delete migration
history. Keep the applied snapshot in that environment and plan adoption separately.
