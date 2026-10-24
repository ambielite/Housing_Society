const MoveIn = require("./moveIn.model");
const db = require("../../../config/db");

const create = async (data) => {
    return await MoveIn.create(data);
};

const findAll = async () => {
    return await MoveIn.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await MoveIn.findByPk(id);
};

const findBySociety = async (societyId) => {
    return await MoveIn.findAll({
        where: { societyId },
        order: [["created_at", "DESC"]]
    });
};

const findByUnit = async (unitId) => {
    return await MoveIn.findAll({
        where: { unitId },
        order: [["created_at", "DESC"]]
    });
};

const findByResident = async (residentId) => {
    return await MoveIn.findAll({
        where: { residentId },
        order: [["created_at", "DESC"]]
    });
};

const findByStatus = async (status) => {
    return await MoveIn.findAll({
        where: { status },
        order: [["created_at", "DESC"]]
    });
};

const findPendingReview = async () => {
    return await MoveIn.findAll({
        where: {
            status: [
                "PENDING_DOCUMENTS",
                "DOCUMENTS_SUBMITTED",
                "UNDER_VERIFICATION",
                "APPROVED",
                "GATE_PASS_ISSUED",
                "LEDGER_CREATED",
                "ACCESS_ACTIVATED"
            ]
        },
        order: [["created_at", "DESC"]]
    });
};

const update = async (id, data) => {
    const moveIn = await MoveIn.findByPk(id);

    if (!moveIn) {
        return null;
    }

    await moveIn.update(data);

    return moveIn;
};

const deleteById = async (id) => {
    const moveIn = await MoveIn.findByPk(id);

    if (!moveIn) {
        return null;
    }

    await moveIn.destroy();

    return moveIn;
};

const saveDocuments = async (moveInId, files = {}, documentFields = []) => {
    const client = await db.getClient();
    try {
        await client.query("BEGIN");
        for (const documentType of documentFields) {
            const file = files[documentType]?.[0];
            if (!file) continue;
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
                [moveInId, documentType, file.originalname, file.mimetype, file.size, file.buffer]
            );
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const findDocument = async (moveInId, documentType) => {
    const result = await db.query(
        `SELECT d.move_in_id, d.document_type, d.original_filename, d.mime_type, d.file_size, d.content,
                m.society_id
         FROM move_in_documents d
         JOIN move_ins m ON m.id = d.move_in_id
         WHERE d.move_in_id = $1 AND d.document_type = $2`,
        [moveInId, documentType]
    );
    return result.rows[0] || null;
};

module.exports = {
    create,
    findAll,
    findById,
    findBySociety,
    findByUnit,
    findByResident,
    findByStatus,
    findPendingReview,
    update,
    deleteById,
    saveDocuments,
    findDocument
};
