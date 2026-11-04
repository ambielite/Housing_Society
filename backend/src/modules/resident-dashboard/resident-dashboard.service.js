const { query } = require('../../config/db');
const noticesService = require('../notices/notices.service');

const getDashboard = async (user) => {
  const societyId = user.societyId;
  if (!societyId) {
    return { society: null, unit: null, maintenance: null, notices: [] };
  }

  const homeResult = await query(
    `SELECT s.id AS society_id, s.name AS society_name, s.currency,
            s.logo_url AS society_logo_url, s.address AS society_address,
            s.email AS society_email, s.phone AS society_phone,
            r.id AS resident_id, r.display_name, r.profile_photo AS resident_photo_url,
            t.name AS tower_name, f.name AS floor_name, u.unit_number
       FROM societies s
       LEFT JOIN residents r
         ON r.society_id = s.id
        AND (r.user_id = $2 OR (r.user_id IS NULL AND lower(r.email) = lower($3)))
        AND r.status = 'ACTIVE'
       LEFT JOIN owner_units ou
         ON ou.owner_id = r.id AND ou.society_id = s.id AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       LEFT JOIN units u ON u.id = ou.unit_id
       LEFT JOIN floors f ON f.id = u.floor_id
       LEFT JOIN towers t ON t.id = f.tower_id
      WHERE s.id = $1
      ORDER BY ou.effective_from DESC NULLS LAST
      LIMIT 1`,
    [societyId, user.id, user.email],
  );
  const home = homeResult.rows[0];

  let maintenance = null;
  if (home?.resident_id) {
    const invoiceResult = await query(
      `SELECT i.invoice_number, i.billing_period, i.due_date,
              i.outstanding_amount, i.status, i.description
         FROM invoices i
         JOIN owner_units ou ON ou.unit_id = i.unit_id
        WHERE ou.owner_id = $1 AND ou.society_id = $2 AND ou.status = 'ACTIVE'
          AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
          AND i.society_id = $2 AND i.outstanding_amount > 0
          AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
        ORDER BY i.due_date ASC
        LIMIT 1`,
      [home.resident_id, societyId],
    );
    maintenance = invoiceResult.rows[0] || null;
  }

  const getAllNotices = async (tab) => {
    const firstPage = await noticesService.list(societyId, {
      tab,
      page: 1,
      limit: 100,
    });
    const pageCount = Math.ceil(firstPage.total / firstPage.limit);
    if (pageCount <= 1) return firstPage.rows;
    const remainingPages = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        noticesService.list(societyId, {
          tab,
          page: index + 2,
          limit: firstPage.limit,
        }),
      ),
    );
    return firstPage.rows.concat(...remainingPages.map((page) => page.rows));
  };
  const notices = await getAllNotices('current');
  notices.sort((left, right) => {
    const leftDate = new Date(
      left.posted_at || left.scheduled_at || left.created_at || 0,
    ).getTime();
    const rightDate = new Date(
      right.posted_at || right.scheduled_at || right.created_at || 0,
    ).getTime();
    return rightDate - leftDate;
  });

  return {
    society: home ? {
      id: home.society_id,
      name: home.society_name,
      currency: home.currency,
      logoUrl: home.society_logo_url,
      address: home.society_address,
      email: home.society_email,
      phone: home.society_phone,
    } : null,
    resident: home?.resident_id ? { photoUrl: home.resident_photo_url } : null,
    unit: home?.unit_number ? {
      number: home.unit_number,
      tower: home.tower_name,
      floor: home.floor_name,
    } : null,
    maintenance,
    notices,
  };
};

module.exports = { getDashboard };
