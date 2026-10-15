const db = require('../../config/db');

/**
 * Read-only reporting queries (DB Architecture doc, Section 24: "Operational
 * reports should read from normalized tables" - no dashboard tables are
 * created). Every query is scoped by society_id ($1). Range queries take
 * ($1 society, $2 fromDate, $3 toDate); both dates are optional (NULL = open).
 */

// timestamptz column inside [from, to] (inclusive of the whole "to" day)
const TS = (col) =>
  `($2::date IS NULL OR ${col} >= $2::date) AND ($3::date IS NULL OR ${col} < ($3::date + 1))`;
// DATE column inside [from, to]
const D = (col) =>
  `($2::date IS NULL OR ${col} >= $2::date) AND ($3::date IS NULL OR ${col} <= $3::date)`;

const rng = (societyId, fromDate, toDate) => [societyId, fromDate || null, toDate || null];
const many = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await db.query(sql, params)).rows[0] || null;

// ============================================================================
// DASHBOARD (Phase 17 widgets that belong to this side of the system)
// ============================================================================

const dashboardCounts = (societyId) =>
  one(
    `SELECT
       (SELECT COUNT(*)::int FROM vehicles WHERE society_id = $1) AS total_vehicles,
       (SELECT COUNT(*)::int FROM vehicles WHERE society_id = $1 AND status = 'ACTIVE') AS active_vehicles,
       (SELECT COUNT(*)::int FROM parking_slots s JOIN parking_areas pa ON pa.id = s.parking_area_id
         WHERE pa.society_id = $1) AS total_slots,
       (SELECT COUNT(DISTINCT al.slot_id)::int FROM parking_allocations al
         JOIN parking_slots s ON s.id = al.slot_id JOIN parking_areas pa ON pa.id = s.parking_area_id
         WHERE pa.society_id = $1 AND al.status = 'ACTIVE') AS occupied_slots,
       (SELECT COUNT(*)::int FROM visitor_passes vp JOIN gates g ON g.id = vp.gate_id
         WHERE g.society_id = $1 AND vp.created_at >= CURRENT_DATE) AS visitors_today,
       (SELECT COUNT(*)::int FROM visitor_passes vp JOIN gates g ON g.id = vp.gate_id
         WHERE g.society_id = $1 AND vp.status = 'INSIDE') AS visitors_inside,
       (SELECT COUNT(*)::int FROM gate_events WHERE society_id = $1 AND event_type = 'ENTRY'
         AND event_at >= CURRENT_DATE) AS gate_entries_today,
       (SELECT COUNT(*)::int FROM overstay_alerts oa JOIN visitor_passes vp ON vp.id = oa.visitor_pass_id
         JOIN gates g ON g.id = vp.gate_id WHERE g.society_id = $1 AND oa.status = 'OPEN') AS open_overstay_alerts,
       (SELECT COUNT(*)::int FROM tickets WHERE society_id = $1
         AND status NOT IN ('RESOLVED','CLOSED')) AS open_tickets,
       (SELECT COUNT(*)::int FROM sla_timers tm JOIN tickets t ON t.id = tm.ticket_id
         WHERE t.society_id = $1 AND t.status NOT IN ('RESOLVED','CLOSED')
           AND (tm.status = 'BREACHED' OR (tm.status = 'RUNNING' AND tm.resolution_due_at < now()))) AS sla_breaches,
       (SELECT COUNT(*)::int FROM approval_requests WHERE society_id = $1 AND status = 'PENDING') AS pending_approvals,
       (SELECT COUNT(*)::int FROM vendors WHERE society_id = $1 AND status = 'ACTIVE') AS active_vendors,
       (SELECT COUNT(*)::int FROM vendor_contracts c JOIN vendors v ON v.id = c.vendor_id
         WHERE v.society_id = $1 AND c.status = 'ACTIVE' AND c.end_date IS NOT NULL
           AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS contracts_expiring_30d,
       (SELECT COUNT(*)::int FROM amenity_bookings b JOIN amenity_slots s ON s.id = b.amenity_slot_id
         JOIN amenities a ON a.id = s.amenity_id
         WHERE a.society_id = $1 AND s.slot_date = CURRENT_DATE AND b.status IN ('CONFIRMED','PENDING_PAYMENT')) AS amenity_bookings_today,
       (SELECT COUNT(*)::int FROM meter_readings r JOIN meters m ON m.id = r.meter_id
         WHERE m.society_id = $1 AND r.status IN ('SUBMITTED','ESTIMATED')) AS readings_awaiting_validation`,
    [societyId]
  );

// ============================================================================
// OPERATIONS: vehicles & parking
// ============================================================================

const vehicleCounts = (societyId) =>
  many(
    `SELECT vehicle_type, status, COUNT(*)::int AS count FROM vehicles
     WHERE society_id = $1 GROUP BY vehicle_type, status ORDER BY vehicle_type, status`,
    [societyId]
  );

const vehicleCredentialCounts = (societyId) =>
  many(
    `SELECT c.credential_type, c.status, COUNT(*)::int AS count
     FROM vehicle_access_credentials c JOIN vehicles v ON v.id = c.vehicle_id
     WHERE v.society_id = $1 GROUP BY c.credential_type, c.status ORDER BY 1, 2`,
    [societyId]
  );

const vehicleRows = (societyId, limit) =>
  many(
    `SELECT registration_no, vehicle_type, make, model, color, status, unit_id, created_at
     FROM vehicles WHERE society_id = $1 ORDER BY created_at DESC LIMIT $2::int`,
    [societyId, limit]
  );

const parkingSlotTotals = (societyId) =>
  one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE s.status = 'ACTIVE')::int AS active,
            COUNT(*) FILTER (WHERE s.status <> 'ACTIVE')::int AS inactive,
            COUNT(occ.slot_id)::int AS occupied
     FROM parking_slots s
     JOIN parking_areas pa ON pa.id = s.parking_area_id
     LEFT JOIN (SELECT DISTINCT slot_id FROM parking_allocations WHERE status = 'ACTIVE') occ ON occ.slot_id = s.id
     WHERE pa.society_id = $1`,
    [societyId]
  );

const parkingByArea = (societyId) =>
  many(
    `SELECT pa.id AS area_id, pa.name, pa.parking_type, COUNT(s.id)::int AS total, COUNT(occ.slot_id)::int AS occupied
     FROM parking_areas pa
     LEFT JOIN parking_slots s ON s.parking_area_id = pa.id
     LEFT JOIN (SELECT DISTINCT slot_id FROM parking_allocations WHERE status = 'ACTIVE') occ ON occ.slot_id = s.id
     WHERE pa.society_id = $1 GROUP BY pa.id, pa.name, pa.parking_type ORDER BY pa.name`,
    [societyId]
  );

const parkingByVehicleType = (societyId) =>
  many(
    `SELECT s.vehicle_type, COUNT(s.id)::int AS total, COUNT(occ.slot_id)::int AS occupied
     FROM parking_slots s JOIN parking_areas pa ON pa.id = s.parking_area_id
     LEFT JOIN (SELECT DISTINCT slot_id FROM parking_allocations WHERE status = 'ACTIVE') occ ON occ.slot_id = s.id
     WHERE pa.society_id = $1 GROUP BY s.vehicle_type ORDER BY s.vehicle_type`,
    [societyId]
  );

const parkingAllocationSummary = (societyId) =>
  many(
    `SELECT al.allocation_type, COUNT(*)::int AS count, COALESCE(SUM(al.fee), 0)::float8 AS fee
     FROM parking_allocations al JOIN parking_slots s ON s.id = al.slot_id
     JOIN parking_areas pa ON pa.id = s.parking_area_id
     WHERE pa.society_id = $1 AND al.status = 'ACTIVE' GROUP BY al.allocation_type ORDER BY 1`,
    [societyId]
  );

const parkingVisitSummary = (societyId, fromDate, toDate) =>
  many(
    `SELECT status, COUNT(*)::int AS count FROM parking_visits
     WHERE society_id = $1 AND ${TS('entry_at')} GROUP BY status ORDER BY status`,
    rng(societyId, fromDate, toDate)
  );

// ============================================================================
// SECURITY: visitors, gate activity, overstay, deliveries
// ============================================================================

const visitorPassStatus = (s, f, t) =>
  many(
    `SELECT vp.status, COUNT(*)::int AS count FROM visitor_passes vp JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND ${TS('vp.created_at')} GROUP BY vp.status ORDER BY vp.status`,
    rng(s, f, t)
  );

const visitorInviteStatus = (s, f, t) =>
  many(
    `SELECT status, COUNT(*)::int AS count FROM visitor_invites
     WHERE society_id = $1 AND ${TS('created_at')} GROUP BY status ORDER BY status`,
    rng(s, f, t)
  );

const visitorProfileTotals = (societyId) =>
  one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE blacklist_status = 'BLACKLISTED')::int AS blacklisted
     FROM visitor_profiles WHERE society_id = $1`,
    [societyId]
  );

const visitorsByDay = (s, f, t) =>
  many(
    `SELECT to_char(vp.created_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
     FROM visitor_passes vp JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND ${TS('vp.created_at')} GROUP BY 1 ORDER BY 1`,
    rng(s, f, t)
  );

const visitorsInsideNow = (societyId) =>
  one(
    `SELECT COUNT(*)::int AS count FROM visitor_passes vp JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND vp.status = 'INSIDE'`,
    [societyId]
  );

const visitorRows = (s, f, t, limit) =>
  many(
    `SELECT vp.pass_no, pf.name AS visitor_name, pf.phone, g.name AS gate, vp.status,
            vp.valid_from, vp.valid_until, vp.created_at
     FROM visitor_passes vp JOIN visitor_profiles pf ON pf.id = vp.visitor_profile_id
     JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND ${TS('vp.created_at')}
     ORDER BY vp.created_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const gateTotals = (s, f, t) =>
  many(
    `SELECT event_type, COUNT(*)::int AS count FROM gate_events
     WHERE society_id = $1 AND ${TS('event_at')} GROUP BY event_type`,
    rng(s, f, t)
  );

const gateByGate = (s, f, t) =>
  many(
    `SELECT g.id AS gate_id, g.name,
            COUNT(e.id) FILTER (WHERE e.event_type = 'ENTRY')::int AS entries,
            COUNT(e.id) FILTER (WHERE e.event_type = 'EXIT')::int AS exits
     FROM gates g LEFT JOIN gate_events e ON e.gate_id = g.id AND ${TS('e.event_at')}
     WHERE g.society_id = $1 GROUP BY g.id, g.name ORDER BY g.name`,
    rng(s, f, t)
  );

const gateByDay = (s, f, t) =>
  many(
    `SELECT to_char(event_at::date, 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE event_type = 'ENTRY')::int AS entries,
            COUNT(*) FILTER (WHERE event_type = 'EXIT')::int AS exits
     FROM gate_events WHERE society_id = $1 AND ${TS('event_at')} GROUP BY 1 ORDER BY 1`,
    rng(s, f, t)
  );

const gateRows = (s, f, t, limit) =>
  many(
    `SELECT e.event_at, e.event_type, g.name AS gate, vp.pass_no, v.registration_no AS vehicle_no
     FROM gate_events e JOIN gates g ON g.id = e.gate_id
     LEFT JOIN visitor_passes vp ON vp.id = e.visitor_pass_id
     LEFT JOIN vehicles v ON v.id = e.vehicle_id
     WHERE e.society_id = $1 AND ${TS('e.event_at')} ORDER BY e.event_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const overstaySummary = (s, f, t) =>
  one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE oa.status = 'OPEN')::int AS open,
            COUNT(*) FILTER (WHERE oa.status = 'ACKNOWLEDGED')::int AS acknowledged,
            COUNT(*) FILTER (WHERE oa.status = 'RESOLVED')::int AS resolved,
            COALESCE(ROUND(AVG(oa.duration_minutes)::numeric, 2), 0)::float8 AS avg_duration_minutes,
            COALESCE(MAX(oa.duration_minutes), 0)::int AS max_duration_minutes
     FROM overstay_alerts oa JOIN visitor_passes vp ON vp.id = oa.visitor_pass_id
     JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND ${TS('oa.triggered_at')}`,
    rng(s, f, t)
  );

const overstayRows = (s, f, t, limit) =>
  many(
    `SELECT vp.pass_no, pf.name AS visitor_name, g.name AS gate, oa.triggered_at,
            oa.duration_minutes, oa.status
     FROM overstay_alerts oa JOIN visitor_passes vp ON vp.id = oa.visitor_pass_id
     JOIN visitor_profiles pf ON pf.id = vp.visitor_profile_id JOIN gates g ON g.id = vp.gate_id
     WHERE g.society_id = $1 AND ${TS('oa.triggered_at')} ORDER BY oa.triggered_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const deliveryByStatus = (s, f, t) =>
  many(
    `SELECT status, COUNT(*)::int AS count FROM deliveries
     WHERE society_id = $1 AND ${TS('created_at')} GROUP BY status ORDER BY status`,
    rng(s, f, t)
  );

const deliveryByType = (s, f, t) =>
  many(
    `SELECT delivery_type, COUNT(*)::int AS count FROM deliveries
     WHERE society_id = $1 AND ${TS('created_at')} GROUP BY delivery_type ORDER BY delivery_type`,
    rng(s, f, t)
  );

const deliveryStats = (s, f, t) =>
  one(
    `SELECT COALESCE(ROUND((AVG(EXTRACT(EPOCH FROM (handed_over_at - received_at)) / 60)
              FILTER (WHERE handed_over_at IS NOT NULL AND received_at IS NOT NULL))::numeric, 2), 0)::float8
              AS avg_handover_minutes
     FROM deliveries WHERE society_id = $1 AND ${TS('created_at')}`,
    rng(s, f, t)
  );

const parcelsUncollected = (societyId) =>
  one(
    `SELECT COUNT(*)::int AS count FROM parcels p JOIN deliveries d ON d.id = p.delivery_id
     WHERE d.society_id = $1 AND p.status = 'STORED'`,
    [societyId]
  );

const deliveryRows = (s, f, t, limit) =>
  many(
    `SELECT d.delivery_type, d.courier_name, d.tracking_no, d.unit_id, d.status,
            d.received_at, d.handed_over_at, d.created_at
     FROM deliveries d WHERE d.society_id = $1 AND ${TS('d.created_at')}
     ORDER BY d.created_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

// ============================================================================
// HELPDESK
// ============================================================================

const ticketByStatus = (s, f, t) =>
  many(
    `SELECT status, COUNT(*)::int AS count FROM tickets
     WHERE society_id = $1 AND ${TS('opened_at')} GROUP BY status ORDER BY status`,
    rng(s, f, t)
  );

const ticketByPriority = (s, f, t) =>
  many(
    `SELECT priority, COUNT(*)::int AS count FROM tickets
     WHERE society_id = $1 AND ${TS('opened_at')} GROUP BY priority ORDER BY priority`,
    rng(s, f, t)
  );

const ticketByCategory = (s, f, t) =>
  many(
    `SELECT c.name AS category, COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE tk.status NOT IN ('RESOLVED','CLOSED'))::int AS open
     FROM tickets tk JOIN ticket_categories c ON c.id = tk.category_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')} GROUP BY c.name ORDER BY total DESC`,
    rng(s, f, t)
  );

// "Response" = first status change away from OPEN (no separate first-response column in the schema).
const ticketTimes = (s, f, t) =>
  one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE tk.status NOT IN ('RESOLVED','CLOSED'))::int AS open,
            COUNT(*) FILTER (WHERE tk.status IN ('RESOLVED','CLOSED'))::int AS closed,
            COALESCE(ROUND((AVG(EXTRACT(EPOCH FROM (tk.resolved_at - tk.opened_at)) / 3600)
              FILTER (WHERE tk.resolved_at IS NOT NULL))::numeric, 2), 0)::float8 AS avg_resolution_hours,
            COALESCE(ROUND((AVG(EXTRACT(EPOCH FROM (fr.first_at - tk.opened_at)) / 3600)
              FILTER (WHERE fr.first_at IS NOT NULL))::numeric, 2), 0)::float8 AS avg_response_hours
     FROM tickets tk
     LEFT JOIN (SELECT ticket_id, MIN(changed_at) AS first_at FROM ticket_status_history
                WHERE old_status = 'OPEN' GROUP BY ticket_id) fr ON fr.ticket_id = tk.id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')}`,
    rng(s, f, t)
  );

const ticketRatingAvg = (s, f, t) =>
  one(
    `SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)::float8 AS avg_rating, COUNT(*)::int AS rated
     FROM ticket_ratings r JOIN tickets tk ON tk.id = r.ticket_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')}`,
    rng(s, f, t)
  );

const ticketRows = (s, f, t, limit) =>
  many(
    `SELECT tk.ticket_no, tk.subject, c.name AS category, tk.priority, tk.status,
            tk.opened_at, tk.resolved_at, tk.closed_at
     FROM tickets tk JOIN ticket_categories c ON c.id = tk.category_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')} ORDER BY tk.opened_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const slaTimerStatus = (s, f, t) =>
  many(
    `SELECT tm.status, COUNT(*)::int AS count FROM sla_timers tm JOIN tickets tk ON tk.id = tm.ticket_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')} GROUP BY tm.status ORDER BY tm.status`,
    rng(s, f, t)
  );

const slaOverdueRunning = (s, f, t) =>
  one(
    `SELECT COUNT(*)::int AS count FROM sla_timers tm JOIN tickets tk ON tk.id = tm.ticket_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')}
       AND tm.status = 'RUNNING' AND tm.resolution_due_at < now()`,
    rng(s, f, t)
  );

const slaBreachRows = (s, f, t, limit) =>
  many(
    `SELECT tk.ticket_no, tk.priority, tk.status AS ticket_status, p.name AS sla_policy,
            tm.response_due_at, tm.resolution_due_at, tm.breached_at, tm.status AS timer_status
     FROM sla_timers tm JOIN tickets tk ON tk.id = tm.ticket_id JOIN sla_policies p ON p.id = tm.sla_policy_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')}
       AND (tm.status = 'BREACHED' OR (tm.status = 'RUNNING' AND tm.resolution_due_at < now()))
     ORDER BY tm.resolution_due_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const categoryTrends = (s, f, t) =>
  many(
    `SELECT to_char(date_trunc('month', tk.opened_at), 'YYYY-MM') AS month, c.name AS category,
            COUNT(*)::int AS count
     FROM tickets tk JOIN ticket_categories c ON c.id = tk.category_id
     WHERE tk.society_id = $1 AND ${TS('tk.opened_at')} GROUP BY 1, 2 ORDER BY 1, 2`,
    rng(s, f, t)
  );

// ============================================================================
// VENDORS
// ============================================================================

const vendorOutstanding = (s, f, t) =>
  many(
    `WITH inv AS (
       SELECT i.vendor_id, i.total::float8 AS total, i.due_date,
              COALESCE((SELECT SUM(p.allocated_amount) FROM vendor_payments p
                        WHERE p.vendor_invoice_id = i.id), 0)::float8 AS paid
       FROM vendor_invoices i JOIN vendors v ON v.id = i.vendor_id
       WHERE v.society_id = $1 AND i.status NOT IN ('DRAFT','CANCELLED') AND ${D('i.invoice_date')}
     )
     SELECT v.id AS vendor_id, v.legal_name AS vendor, COUNT(*)::int AS invoice_count,
            ROUND(SUM(inv.total)::numeric, 2)::float8 AS billed,
            ROUND(SUM(inv.paid)::numeric, 2)::float8 AS paid,
            ROUND(SUM(GREATEST(inv.total - inv.paid, 0))::numeric, 2)::float8 AS outstanding,
            ROUND(COALESCE(SUM(GREATEST(inv.total - inv.paid, 0))
              FILTER (WHERE inv.due_date < CURRENT_DATE), 0)::numeric, 2)::float8 AS overdue
     FROM inv JOIN vendors v ON v.id = inv.vendor_id
     GROUP BY v.id, v.legal_name ORDER BY outstanding DESC`,
    rng(s, f, t)
  );

const contractStatus = (societyId) =>
  many(
    `SELECT c.status, COUNT(*)::int AS count, COALESCE(SUM(c.value), 0)::float8 AS value
     FROM vendor_contracts c JOIN vendors v ON v.id = c.vendor_id
     WHERE v.society_id = $1 GROUP BY c.status ORDER BY c.status`,
    [societyId]
  );

const contractRows = (societyId, expiringInDays, limit) =>
  many(
    `SELECT v.legal_name AS vendor, c.contract_no, to_char(c.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(c.end_date, 'YYYY-MM-DD') AS end_date, c.value::float8 AS value, c.status,
            (c.status = 'ACTIVE' AND c.end_date IS NOT NULL
              AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2::int) AS expiring_soon
     FROM vendor_contracts c JOIN vendors v ON v.id = c.vendor_id
     WHERE v.society_id = $1 ORDER BY c.end_date NULLS LAST LIMIT $3::int`,
    [societyId, expiringInDays, limit]
  );

const vendorSpend = (s, f, t) =>
  many(
    `SELECT v.id AS vendor_id, v.legal_name AS vendor,
            COALESCE(po.po_count, 0)::int AS po_count, COALESCE(po.po_total, 0)::float8 AS po_total,
            COALESCE(iv.invoiced, 0)::float8 AS invoiced, COALESCE(iv.paid, 0)::float8 AS paid
     FROM vendors v
     LEFT JOIN (SELECT vendor_id, COUNT(*) AS po_count, SUM(total) AS po_total FROM purchase_orders
                WHERE status <> 'CANCELLED' AND ${D('po_date')} GROUP BY vendor_id) po ON po.vendor_id = v.id
     LEFT JOIN (SELECT i.vendor_id, SUM(i.total) AS invoiced,
                       SUM(i.total) FILTER (WHERE i.status = 'PAID') AS paid
                FROM vendor_invoices i WHERE i.status NOT IN ('DRAFT','CANCELLED') AND ${D('i.invoice_date')}
                GROUP BY i.vendor_id) iv ON iv.vendor_id = v.id
     WHERE v.society_id = $1 AND (po.vendor_id IS NOT NULL OR iv.vendor_id IS NOT NULL)
     ORDER BY po_total DESC`,
    rng(s, f, t)
  );

const vendorSlaPerformance = (s, f, t) =>
  many(
    `SELECT v.id AS vendor_id, v.legal_name AS vendor,
            COUNT(DISTINCT tk.id)::int AS tickets_assigned,
            COUNT(DISTINCT tk.id) FILTER (WHERE tk.status IN ('RESOLVED','CLOSED'))::int AS resolved,
            COUNT(DISTINCT tk.id) FILTER (WHERE tm.status = 'BREACHED'
              OR (tm.status = 'RUNNING' AND tm.resolution_due_at < now()))::int AS sla_breached,
            COALESCE(ROUND((AVG(EXTRACT(EPOCH FROM (tk.resolved_at - tk.opened_at)) / 3600)
              FILTER (WHERE tk.resolved_at IS NOT NULL))::numeric, 2), 0)::float8 AS avg_resolution_hours
     FROM ticket_assignments ta JOIN vendors v ON v.id = ta.assigned_vendor_id
     JOIN tickets tk ON tk.id = ta.ticket_id LEFT JOIN sla_timers tm ON tm.ticket_id = tk.id
     WHERE v.society_id = $1 AND ${TS('tk.opened_at')}
     GROUP BY v.id, v.legal_name ORDER BY tickets_assigned DESC`,
    rng(s, f, t)
  );

// ============================================================================
// PROCUREMENT
// ============================================================================

const prByStatus = (s, f, t) =>
  many(
    `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(estimated_amount), 0)::float8 AS amount
     FROM purchase_requests WHERE society_id = $1 AND ${D('requested_date')} GROUP BY status ORDER BY status`,
    rng(s, f, t)
  );

const rfqByStatus = (s, f, t) =>
  many(
    `SELECT r.status, COUNT(*)::int AS count FROM rfqs r JOIN purchase_requests pr ON pr.id = r.purchase_request_id
     WHERE pr.society_id = $1 AND ${D('r.issue_date')} GROUP BY r.status ORDER BY r.status`,
    rng(s, f, t)
  );

const quotationByStatus = (s, f, t) =>
  many(
    `SELECT q.status, COUNT(*)::int AS count, COALESCE(SUM(q.total), 0)::float8 AS amount
     FROM quotations q JOIN rfqs r ON r.id = q.rfq_id JOIN purchase_requests pr ON pr.id = r.purchase_request_id
     WHERE pr.society_id = $1 AND ${D('q.quotation_date')} GROUP BY q.status ORDER BY q.status`,
    rng(s, f, t)
  );

const poByStatus = (s, f, t) =>
  many(
    `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::float8 AS amount
     FROM purchase_orders WHERE society_id = $1 AND ${D('po_date')} GROUP BY status ORDER BY status`,
    rng(s, f, t)
  );

const vendorInvoiceByStatus = (s, f, t) =>
  many(
    `SELECT i.status, COUNT(*)::int AS count, COALESCE(SUM(i.total), 0)::float8 AS amount
     FROM vendor_invoices i JOIN vendors v ON v.id = i.vendor_id
     WHERE v.society_id = $1 AND ${D('i.invoice_date')} GROUP BY i.status ORDER BY i.status`,
    rng(s, f, t)
  );

const goodsReceiptByStatus = (s, f, t) =>
  many(
    `SELECT g.status, COUNT(*)::int AS count FROM goods_receipts g JOIN purchase_orders po ON po.id = g.purchase_order_id
     WHERE po.society_id = $1 AND ${TS('g.received_at')} GROUP BY g.status ORDER BY g.status`,
    rng(s, f, t)
  );

const poRows = (s, f, t, limit) =>
  many(
    `SELECT po.po_no, v.legal_name AS vendor, to_char(po.po_date, 'YYYY-MM-DD') AS po_date,
            to_char(po.delivery_date, 'YYYY-MM-DD') AS delivery_date,
            po.subtotal::float8 AS subtotal, po.tax::float8 AS tax, po.total::float8 AS total, po.status
     FROM purchase_orders po JOIN vendors v ON v.id = po.vendor_id
     WHERE po.society_id = $1 AND ${D('po.po_date')} ORDER BY po.po_date DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const vendorBillRows = (s, f, t, limit) =>
  many(
    `SELECT i.invoice_no, v.legal_name AS vendor, po.po_no, to_char(i.invoice_date, 'YYYY-MM-DD') AS invoice_date,
            to_char(i.due_date, 'YYYY-MM-DD') AS due_date, i.subtotal::float8 AS subtotal,
            i.tax::float8 AS tax, i.total::float8 AS total, i.status
     FROM vendor_invoices i JOIN vendors v ON v.id = i.vendor_id
     LEFT JOIN purchase_orders po ON po.id = i.purchase_order_id
     WHERE v.society_id = $1 AND ${D('i.invoice_date')} ORDER BY i.invoice_date DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

const findRfqForSociety = (societyId, rfqId) =>
  one(
    `SELECT r.id, r.rfq_no, r.status, pr.request_no
     FROM rfqs r JOIN purchase_requests pr ON pr.id = r.purchase_request_id
     WHERE r.id = $2::uuid AND pr.society_id = $1`,
    [societyId, rfqId]
  );

const rfqQuotations = (rfqId) =>
  many(
    `SELECT q.id AS quotation_id, q.vendor_id, v.legal_name AS vendor, q.quotation_no,
            to_char(q.quotation_date, 'YYYY-MM-DD') AS quotation_date,
            to_char(q.valid_until, 'YYYY-MM-DD') AS valid_until,
            q.subtotal::float8 AS subtotal, q.tax::float8 AS tax, q.total::float8 AS total, q.status
     FROM quotations q JOIN vendors v ON v.id = q.vendor_id WHERE q.rfq_id = $1::uuid ORDER BY q.total ASC`,
    [rfqId]
  );

const rfqScores = (rfqId) =>
  many(
    `SELECT vendor_id, criterion, score::float8 AS score, remarks FROM quotation_comparisons
     WHERE rfq_id = $1::uuid ORDER BY vendor_id, criterion`,
    [rfqId]
  );

// ============================================================================
// AMENITIES (range applies to slot_date)
// ============================================================================

const amenityUtilization = (s, f, t) =>
  many(
    `WITH sl AS (
       SELECT s.amenity_id, COUNT(*)::int AS slots, COALESCE(SUM(s.capacity), 0)::int AS capacity
       FROM amenity_slots s JOIN amenities a ON a.id = s.amenity_id
       WHERE a.society_id = $1 AND s.status <> 'CANCELLED' AND ${D('s.slot_date')} GROUP BY s.amenity_id
     ), bk AS (
       SELECT s.amenity_id,
              COUNT(*) FILTER (WHERE b.status IN ('CONFIRMED','NO_SHOW','PENDING_PAYMENT'))::int AS booked,
              COUNT(*) FILTER (WHERE b.status = 'CANCELLED')::int AS cancelled,
              COUNT(*) FILTER (WHERE b.status = 'EXPIRED')::int AS expired,
              COUNT(*) FILTER (WHERE b.status = 'NO_SHOW')::int AS no_shows,
              COALESCE(SUM(b.amount) FILTER (WHERE b.status IN ('CONFIRMED','NO_SHOW')), 0)::float8 AS revenue
       FROM amenity_bookings b JOIN amenity_slots s ON s.id = b.amenity_slot_id
       JOIN amenities a ON a.id = s.amenity_id
       WHERE a.society_id = $1 AND ${D('s.slot_date')} GROUP BY s.amenity_id
     )
     SELECT a.id AS amenity_id, a.name, a.amenity_type,
            COALESCE(sl.slots, 0) AS slots, COALESCE(sl.capacity, 0) AS capacity,
            COALESCE(bk.booked, 0) AS booked, COALESCE(bk.cancelled, 0) AS cancelled,
            COALESCE(bk.expired, 0) AS expired, COALESCE(bk.no_shows, 0) AS no_shows,
            COALESCE(bk.revenue, 0)::float8 AS revenue,
            CASE WHEN COALESCE(sl.capacity, 0) > 0
                 THEN ROUND(COALESCE(bk.booked, 0) * 100.0 / sl.capacity, 2) ELSE 0 END::float8 AS utilization_pct
     FROM amenities a LEFT JOIN sl ON sl.amenity_id = a.id LEFT JOIN bk ON bk.amenity_id = a.id
     WHERE a.society_id = $1 ORDER BY a.name`,
    rng(s, f, t)
  );

const amenityWeekday = (s, f, t) =>
  many(
    `SELECT EXTRACT(dow FROM sl.slot_date)::int AS weekday, COUNT(*)::int AS bookings
     FROM amenity_bookings b JOIN amenity_slots sl ON sl.id = b.amenity_slot_id
     JOIN amenities a ON a.id = sl.amenity_id
     WHERE a.society_id = $1 AND b.status IN ('CONFIRMED','NO_SHOW','PENDING_PAYMENT') AND ${D('sl.slot_date')}
     GROUP BY 1 ORDER BY 1`,
    rng(s, f, t)
  );

const amenityBookingRows = (s, f, t, limit) =>
  many(
    `SELECT b.booking_no, a.name AS amenity, to_char(sl.slot_date, 'YYYY-MM-DD') AS slot_date,
            sl.start_time, sl.end_time, b.unit_id, b.guests_count, b.amount::float8 AS amount,
            b.status, b.created_at
     FROM amenity_bookings b JOIN amenity_slots sl ON sl.id = b.amenity_slot_id
     JOIN amenities a ON a.id = sl.amenity_id
     WHERE a.society_id = $1 AND ${D('sl.slot_date')} ORDER BY sl.slot_date DESC, sl.start_time LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

// ============================================================================
// UTILITIES
// ============================================================================

const metersByTypeStatus = (societyId) =>
  many(
    `SELECT ut.name AS utility, ut.unit_of_measure, m.status, COUNT(*)::int AS count
     FROM meters m JOIN utility_types ut ON ut.id = m.utility_type_id
     WHERE m.society_id = $1 GROUP BY ut.name, ut.unit_of_measure, m.status ORDER BY 1, 3`,
    [societyId]
  );

const utilityBills = (s, f, t) =>
  many(
    `SELECT ut.name AS utility, ut.unit_of_measure, b.status, COUNT(*)::int AS bills,
            COALESCE(SUM(b.consumption), 0)::float8 AS consumption, COALESCE(SUM(b.amount), 0)::float8 AS amount
     FROM utility_bills b JOIN meters m ON m.id = b.meter_id JOIN utility_types ut ON ut.id = m.utility_type_id
     WHERE m.society_id = $1 AND ${TS('b.created_at')} GROUP BY 1, 2, 3 ORDER BY 1, 3`,
    rng(s, f, t)
  );

const readingsByStatus = (s, f, t) =>
  many(
    `SELECT r.status, COUNT(*)::int AS count FROM meter_readings r JOIN meters m ON m.id = r.meter_id
     WHERE m.society_id = $1 AND ${D('r.reading_date')} GROUP BY r.status ORDER BY r.status`,
    rng(s, f, t)
  );

const utilityBillRows = (s, f, t, limit) =>
  many(
    `SELECT m.meter_no, ut.name AS utility, b.previous_reading::float8 AS previous_reading,
            b.current_reading::float8 AS current_reading, b.consumption::float8 AS consumption,
            b.amount::float8 AS amount, b.status, b.created_at
     FROM utility_bills b JOIN meters m ON m.id = b.meter_id JOIN utility_types ut ON ut.id = m.utility_type_id
     WHERE m.society_id = $1 AND ${TS('b.created_at')} ORDER BY b.created_at DESC LIMIT $4::int`,
    [...rng(s, f, t), limit]
  );

module.exports = {
  dashboardCounts,
  vehicleCounts, vehicleCredentialCounts, vehicleRows,
  parkingSlotTotals, parkingByArea, parkingByVehicleType, parkingAllocationSummary, parkingVisitSummary,
  visitorPassStatus, visitorInviteStatus, visitorProfileTotals, visitorsByDay, visitorsInsideNow, visitorRows,
  gateTotals, gateByGate, gateByDay, gateRows,
  overstaySummary, overstayRows,
  deliveryByStatus, deliveryByType, deliveryStats, parcelsUncollected, deliveryRows,
  ticketByStatus, ticketByPriority, ticketByCategory, ticketTimes, ticketRatingAvg, ticketRows,
  slaTimerStatus, slaOverdueRunning, slaBreachRows, categoryTrends,
  vendorOutstanding, contractStatus, contractRows, vendorSpend, vendorSlaPerformance,
  prByStatus, rfqByStatus, quotationByStatus, poByStatus, vendorInvoiceByStatus, goodsReceiptByStatus,
  poRows, vendorBillRows, findRfqForSociety, rfqQuotations, rfqScores,
  amenityUtilization, amenityWeekday, amenityBookingRows,
  metersByTypeStatus, utilityBills, readingsByStatus, utilityBillRows,
};
