const path = require("node:path");
const fs = require("node:fs/promises");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

const documentTypes = [
    ["leaseDocument", "lease_document"],
    ["registryDocument", "registry_document"],
    ["policeVerificationDocument", "police_verification_document"]
];
const mimeTypes = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 10000,
    });
    await client.connect();
    try {
        const { rows } = await client.query(
            "SELECT id, lease_document, registry_document, police_verification_document FROM move_ins"
        );
        const uploadRoot = path.join(process.cwd(), "uploads", "move-in-documents");
        let migrated = 0;
        let skipped = 0;

        for (const row of rows) {
            for (const [documentType, column] of documentTypes) {
                const storedPath = row[column];
                if (!storedPath) continue;

                let pathname;
                try {
                    pathname = /^https?:\/\//i.test(storedPath) ? new URL(storedPath).pathname : storedPath;
                } catch {
                    skipped += 1;
                    console.warn(`Skipped invalid document path for move-in ${row.id} (${documentType}).`);
                    continue;
                }
                const match = pathname.match(/^\/uploads\/move-in-documents\/([A-Za-z0-9._-]+)$/);
                if (!match) continue; // Already in the database or stored outside the legacy folder.

                const filename = match[1];
                const filePath = path.join(uploadRoot, filename);
                if (path.dirname(filePath) !== uploadRoot) {
                    skipped += 1;
                    continue;
                }

                let content;
                try {
                    content = await fs.readFile(filePath);
                } catch {
                    skipped += 1;
                    console.warn(`Source file is missing; kept its database path: ${filename}`);
                    continue;
                }
                if (!content.length || content.length > 20 * 1024 * 1024) {
                    skipped += 1;
                    console.warn(`File is empty or exceeds 20 MB; kept its database path: ${filename}`);
                    continue;
                }

                const extension = path.extname(filename).toLowerCase();
                const mimeType = mimeTypes[extension];
                if (!mimeType) {
                    skipped += 1;
                    console.warn(`Unsupported file type; kept its database path: ${filename}`);
                    continue;
                }

                await client.query("BEGIN");
                try {
                    await client.query(
                        `INSERT INTO move_in_documents
                            (move_in_id, document_type, original_filename, mime_type, file_size, content)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (move_in_id, document_type) DO UPDATE SET
                            original_filename = EXCLUDED.original_filename,
                            mime_type = EXCLUDED.mime_type,
                            file_size = EXCLUDED.file_size,
                            content = EXCLUDED.content,
                            updated_at = now()`,
                        [row.id, documentType, filename, mimeType, content.length, content]
                    );
                    await client.query(
                        `UPDATE move_ins SET ${column} = $2, updated_at = now() WHERE id = $1`,
                        [row.id, `/move-ins/${row.id}/documents/${documentType}`]
                    );
                    await client.query("COMMIT");
                    migrated += 1;
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                }
            }
        }

        console.log(`Migrated ${migrated} move-in document(s) into PostgreSQL. Skipped ${skipped}.`);
        console.log("Original upload files were left in place as a backup.");
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
