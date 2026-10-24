const db = require('../../config/db');

// --- vendors ----------------------------------------------------------------

const createVendor = async ({ societyId, userId, legalName, tradeName, pan, gstin, contactEmail, phone, addressId }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO vendors (society_id, user_id, legal_name, trade_name, pan, gstin, contact_email, phone, address_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [societyId, userId || null, legalName, tradeName || null, pan || null, gstin || null, contactEmail || null, phone || null, addressId || null]
    );
    const vendor = result.rows[0];
    if (userId) {
      await client.query(
        'INSERT INTO vendor_users (vendor_id, user_id) VALUES ($1, $2)',
        [vendor.id, userId]
      );
    }
    await client.query('COMMIT');
    return vendor;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM vendors WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findByContactEmail = async (societyId, email, excludeId) => {
  const result = await db.query(
    `SELECT id FROM vendors
     WHERE society_id = $1 AND lower(contact_email) = lower($2)
       AND ($3::uuid IS NULL OR id <> $3::uuid)
     LIMIT 1`,
    [societyId, String(email).trim(), excludeId || null]
  );
  return result.rows[0] || null;
};

// Mapping table is authoritative; legacy vendors.user_id remains a fallback.
const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT v.* FROM vendors v
     JOIN vendor_users vu ON vu.vendor_id = v.id
     WHERE vu.user_id = $1
     UNION
     SELECT v.* FROM vendors v
     WHERE v.user_id = $1 AND NOT EXISTS (
       SELECT 1 FROM vendor_users vu WHERE vu.user_id = $1
     )
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const listVendorIdsByUserId = async (userId) => {
  const result = await db.query(
    `SELECT vendor_id FROM vendor_users WHERE user_id = $1
     UNION SELECT id AS vendor_id FROM vendors v WHERE v.user_id = $1
       AND NOT EXISTS (SELECT 1 FROM vendor_users vu WHERE vu.user_id = $1)`,
    [userId]
  );
  return result.rows.map((row) => row.vendor_id);
};

const listVendorUsers = async (vendorId) => {
  const result = await db.query(
    `SELECT u.id, u.society_id, u.email, u.phone, u.first_name, u.last_name,
            u.status, vu.linked_at, vu.linked_by
     FROM vendor_users vu
     JOIN users u ON u.id = vu.user_id
     WHERE vu.vendor_id = $1
     ORDER BY vu.linked_at ASC, u.email ASC`,
    [vendorId]
  );
  return result.rows;
};

const linkUserToVendor = async (vendorId, userId, linkedBy) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO vendor_users (vendor_id, user_id, linked_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [vendorId, userId, linkedBy || null]
    );
    // Maintain the legacy pointer for older consumers, but do not overwrite it.
    await client.query(
      'UPDATE vendors SET user_id = $2, updated_at = now() WHERE id = $1 AND user_id IS NULL',
      [vendorId, userId]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const unlinkUserFromVendor = async (vendorId, userId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'DELETE FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 RETURNING *',
      [vendorId, userId]
    );
    if (result.rowCount && (await client.query('SELECT user_id FROM vendors WHERE id = $1', [vendorId])).rows[0]?.user_id === userId) {
      const replacement = await client.query(
        'SELECT user_id FROM vendor_users WHERE vendor_id = $1 ORDER BY linked_at ASC LIMIT 1',
        [vendorId]
      );
      await client.query(
        'UPDATE vendors SET user_id = $2, updated_at = now() WHERE id = $1',
        [vendorId, replacement.rows[0]?.user_id || null]
      );
    }
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findUserVendorLink = async (userId) => {
  const result = await db.query(
    `SELECT vendor_id FROM vendor_users WHERE user_id = $1
     UNION SELECT id AS vendor_id FROM vendors v WHERE v.user_id = $1
       AND NOT EXISTS (SELECT 1 FROM vendor_users vu WHERE vu.user_id = $1)
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const listVendors = async ({ societyId, status, search, limit, offset }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(legal_name ILIKE $${idx} OR trade_name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const dataResult = await db.query(
    `SELECT * FROM vendors ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM vendors ${whereClause}`, params);

  return { rows: dataResult.rows, total: countResult.rows[0].total };
};

const updateVendor = async (id, { legalName, tradeName, pan, gstin, contactEmail, phone, addressId }) => {
  const result = await db.query(
    `UPDATE vendors SET
       legal_name    = COALESCE($2, legal_name),
       trade_name    = COALESCE($3, trade_name),
       pan           = COALESCE($4, pan),
       gstin         = COALESCE($5, gstin),
       contact_email = COALESCE($6, contact_email),
       phone         = COALESCE($7, phone),
       address_id    = COALESCE($8, address_id),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [id, legalName, tradeName, pan, gstin, contactEmail, phone, addressId]
  );
  return result.rows[0] || null;
};

const updateStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE vendors SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const deleteVendor = async (id) => {
  const result = await db.query('DELETE FROM vendors WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- vendor_contacts ----------------------------------------------------------

const addContact = async ({ vendorId, name, designation, email, phone, isPrimary }) => {
  const result = await db.query(
    `INSERT INTO vendor_contacts (vendor_id, name, designation, email, phone, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vendorId, name, designation || null, email || null, phone || null, !!isPrimary]
  );
  return result.rows[0];
};

const findContactByEmail = async (vendorId, email) => {
  const result = await db.query(
    'SELECT id FROM vendor_contacts WHERE vendor_id = $1 AND lower(email) = lower($2) LIMIT 1',
    [vendorId, String(email).trim()]
  );
  return result.rows[0] || null;
};

const listContacts = async (vendorId) => {
  const result = await db.query(
    'SELECT * FROM vendor_contacts WHERE vendor_id = $1 ORDER BY is_primary DESC, created_at ASC',
    [vendorId]
  );
  return result.rows;
};

const findContactById = async (id) => {
  const result = await db.query('SELECT * FROM vendor_contacts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const deleteContact = async (id) => {
  const result = await db.query('DELETE FROM vendor_contacts WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- vendor_documents ----------------------------------------------------------

const addDocument = async ({ vendorId, documentId, documentType, expiryDate }) => {
  const result = await db.query(
    `INSERT INTO vendor_documents (vendor_id, document_id, document_type, expiry_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [vendorId, documentId || null, documentType, expiryDate || null]
  );
  return result.rows[0];
};

const listDocuments = async (vendorId) => {
  const result = await db.query(
    `SELECT vd.*, d.title AS document_title, d.file_name AS document_file_name,
            d.status AS linked_document_status
     FROM vendor_documents vd
     LEFT JOIN documents d ON d.id = vd.document_id
     WHERE vd.vendor_id = $1
     ORDER BY vd.created_at DESC`,
    [vendorId]
  );
  return result.rows;
};

const findDocumentById = async (id) => {
  const result = await db.query('SELECT * FROM vendor_documents WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const updateDocumentVerification = async (id, verificationStatus) => {
  const result = await db.query(
    'UPDATE vendor_documents SET verification_status = $2 WHERE id = $1 RETURNING *',
    [id, verificationStatus]
  );
  return result.rows[0] || null;
};

// --- vendor_bank_accounts -------------------------------------------------------

const addBankAccount = async ({ vendorId, bankName, accountNoMasked, ifsc, beneficiaryName }) => {
  const result = await db.query(
    `INSERT INTO vendor_bank_accounts (vendor_id, bank_name, account_no_masked, ifsc, beneficiary_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [vendorId, bankName || null, accountNoMasked || null, ifsc || null, beneficiaryName || null]
  );
  return result.rows[0];
};

const listBankAccounts = async (vendorId) => {
  const result = await db.query(
    'SELECT * FROM vendor_bank_accounts WHERE vendor_id = $1 ORDER BY created_at DESC',
    [vendorId]
  );
  return result.rows;
};

const findBankAccountById = async (id) => {
  const result = await db.query('SELECT * FROM vendor_bank_accounts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const verifyBankAccount = async (id) => {
  const result = await db.query(
    `UPDATE vendor_bank_accounts SET status = 'VERIFIED', verified_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// --- vendor_contracts ------------------------------------------------------------

const addContract = async ({ vendorId, contractNo, startDate, endDate, value, paymentTerms }) => {
  const result = await db.query(
    `INSERT INTO vendor_contracts (vendor_id, contract_no, start_date, end_date, value, payment_terms)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vendorId, contractNo, startDate, endDate || null, value || null, paymentTerms || null]
  );
  return result.rows[0];
};

const listContracts = async (vendorId) => {
  const result = await db.query(
    'SELECT * FROM vendor_contracts WHERE vendor_id = $1 ORDER BY created_at DESC',
    [vendorId]
  );
  return result.rows;
};

const findContractById = async (id) => {
  const result = await db.query('SELECT * FROM vendor_contracts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const updateContractStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE vendor_contracts SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

module.exports = {
  createVendor,
  findById,
  findByContactEmail,
  findByUserId,
  listVendorIdsByUserId,
  listVendorUsers,
  linkUserToVendor,
  unlinkUserFromVendor,
  findUserVendorLink,
  listVendors,
  updateVendor,
  updateStatus,
  deleteVendor,
  addContact,
  findContactByEmail,
  listContacts,
  findContactById,
  deleteContact,
  addDocument,
  listDocuments,
  findDocumentById,
  updateDocumentVerification,
  addBankAccount,
  listBankAccounts,
  findBankAccountById,
  verifyBankAccount,
  addContract,
  listContracts,
  findContractById,
  updateContractStatus,
};
