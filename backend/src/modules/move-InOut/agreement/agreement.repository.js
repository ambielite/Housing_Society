const Agreement = require("./agreement.model");
const db = require("../../../config/db");

const create = async (data) => {
    return await Agreement.create(data);
};

const findAll = async () => {
    return await Agreement.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Agreement.findByPk(id);
};

const findByReference = async (agreementReference) => {
    return await Agreement.findOne({
        where: {
            agreementReference
        }
    });
};

const findByUnit = async (unitId) => {
    return await Agreement.findAll({
        where: {
            unitId
        },
        order: [["startDate", "DESC"]]
    });
};

const findByTenant = async (tenantId) => {
    return await Agreement.findAll({
        where: {
            tenantId
        },
        order: [["startDate", "DESC"]]
    });
};

const findByOwner = async (ownerId) => {
    return await Agreement.findAll({
        where: {
            ownerId
        },
        order: [["startDate", "DESC"]]
    });
};

const findActiveByUnit = async (unitId) => {
    return await Agreement.findOne({
        where: {
            unitId,
            status: [
                "ACTIVE",
                "EXPIRING_SOON",
                "RENEWAL_INITIATED"
            ]
        }
    });
};

const findExpiringAgreements = async () => {
    return await Agreement.findAll({
        where: {
            status: "ACTIVE"
        },
        order: [["expiryDate", "ASC"]]
    });
};

const update = async (id, data) => {
    const agreement = await Agreement.findByPk(id);

    if (!agreement) {
        return null;
    }

    await agreement.update(data);

    return agreement;
};

const deleteById = async (id) => {
    const agreement = await Agreement.findByPk(id);

    if (!agreement) {
        return null;
    }

    await agreement.destroy();

    return agreement;
};

const saveDocuments = async (agreementId, files = [], documentFields = []) => {
    const client = await db.getClient();
    try {
        await client.query("BEGIN");
        for (const documentType of documentFields) {
            const file = files[documentType]?.[0];
            if (!file) continue;
            await client.query(
                `INSERT INTO agreement_documents
                    (agreement_id, document_type, original_filename, mime_type, file_size, content)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (agreement_id, document_type) DO UPDATE SET
                    original_filename = EXCLUDED.original_filename,
                    mime_type = EXCLUDED.mime_type,
                    file_size = EXCLUDED.file_size,
                    content = EXCLUDED.content,
                    updated_at = now()`,
                [agreementId, documentType, file.originalname, file.mimetype, file.size, file.buffer]
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

const findDocument = async (agreementId, documentType) => {
    const result = await db.query(
        `SELECT d.agreement_id, d.document_type, d.original_filename, d.mime_type, d.file_size, d.content,
                a.society_id
         FROM agreement_documents d
         JOIN agreements a ON a.id = d.agreement_id
         WHERE d.agreement_id = $1 AND d.document_type = $2`,
        [agreementId, documentType]
    );
    return result.rows[0] || null;
};

module.exports = {
    create,
    findAll,
    findById,
    findByReference,
    findByUnit,
    findByTenant,
    findByOwner,
    findActiveByUnit,
    findExpiringAgreements,
    update,
    deleteById,
    saveDocuments,
    findDocument
};
