const ApiError = require('../../common/ApiError');
const repo = require('./reports-center.repository');

const sum = (rows, key = 'count') => rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
const countOf = (rows, status, key = 'status') => {
  const hit = rows.find((r) => r[key] === status);
  return hit ? Number(hit.count) : 0;
};
const pct = (part, whole) => (whole > 0 ? Number(((part / whole) * 100).toFixed(2)) : 0);
const period = ({ fromDate, toDate }) => ({ fromDate: fromDate || null, toDate: toDate || null });
const wantRows = (p) => Boolean(p.includeRows);

// ============================================================================
// DASHBOARD - key names deliberately match the teammate's executive dashboard
// (vehicles / parking / security / workflow) so the frontend can merge both.
// ============================================================================

const getDashboard = async ({ societyId }) => {
  const c = await repo.dashboardCounts(societyId);
  return {
    generatedAt: new Date(),
    vehicles: { totalVehicles: c.total_vehicles, activeVehicles: c.active_vehicles },
    parking: {
      totalSlots: c.total_slots,
      occupiedSlots: c.occupied_slots,
      vacantSlots: Math.max(c.total_slots - c.occupied_slots, 0),
    },
    security: {
      visitorsToday: c.visitors_today,
      visitorsInside: c.visitors_inside,
      gateEntriesToday: c.gate_entries_today,
      openOverstayAlerts: c.open_overstay_alerts,
    },
    workflow: {
      openTickets: c.open_tickets,
      slaBreaches: c.sla_breaches,
      pendingApprovals: c.pending_approvals, // procurement approval_requests only
    },
    vendors: { activeVendors: c.active_vendors, contractsExpiring30Days: c.contracts_expiring_30d },
    amenities: { bookingsToday: c.amenity_bookings_today },
    utilities: { readingsAwaitingValidation: c.readings_awaiting_validation },
  };
};

// ============================================================================
// OPERATIONS
// ============================================================================

const getVehicleReport = async (p) => {
  const [counts, credentials, rows] = await Promise.all([
    repo.vehicleCounts(p.societyId),
    repo.vehicleCredentialCounts(p.societyId),
    wantRows(p) ? repo.vehicleRows(p.societyId, p.limit) : [],
  ]);
  const ofType = (type) => sum(counts.filter((r) => r.vehicle_type === type));
  return {
    totalVehicles: sum(counts),
    activeVehicles: sum(counts.filter((r) => r.status === 'ACTIVE')),
    twoWheelers: ofType('TWO_WHEELER'),
    fourWheelers: ofType('FOUR_WHEELER'),
    otherVehicles: ofType('OTHER'),
    byTypeAndStatus: counts,
    credentials,
    rows,
  };
};

const getParkingReport = async (p) => {
  const [totals, byArea, byVehicleType, allocations, visits] = await Promise.all([
    repo.parkingSlotTotals(p.societyId),
    repo.parkingByArea(p.societyId),
    repo.parkingByVehicleType(p.societyId),
    repo.parkingAllocationSummary(p.societyId),
    repo.parkingVisitSummary(p.societyId, p.fromDate, p.toDate),
  ]);
  return {
    period: period(p),
    totalParkingSlots: totals.total,
    activeSlots: totals.active,
    inactiveSlots: totals.inactive,
    occupiedSlots: totals.occupied,
    vacantSlots: Math.max(totals.active - totals.occupied, 0),
    occupancyPercentage: pct(totals.occupied, totals.total),
    byArea,
    byVehicleType,
    activeAllocations: { count: sum(allocations), monthlyFeeTotal: sum(allocations, 'fee'), byType: allocations },
    visits: { total: sum(visits), overstay: countOf(visits, 'OVERSTAY'), inside: countOf(visits, 'INSIDE'), byStatus: visits },
  };
};

// ============================================================================
// SECURITY
// ============================================================================

const getVisitorReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [passes, invites, profiles, byDay, inside, rows] = await Promise.all([
    repo.visitorPassStatus(societyId, fromDate, toDate),
    repo.visitorInviteStatus(societyId, fromDate, toDate),
    repo.visitorProfileTotals(societyId),
    repo.visitorsByDay(societyId, fromDate, toDate),
    repo.visitorsInsideNow(societyId),
    wantRows(p) ? repo.visitorRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return {
    period: period(p),
    totalPasses: sum(passes),
    currentlyInside: inside.count,
    passesByStatus: passes,
    invitesByStatus: invites,
    visitorProfiles: profiles,
    visitorsByDay: byDay,
    rows,
  };
};

const getGateActivityReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [totals, byGate, byDay, inside, rows] = await Promise.all([
    repo.gateTotals(societyId, fromDate, toDate),
    repo.gateByGate(societyId, fromDate, toDate),
    repo.gateByDay(societyId, fromDate, toDate),
    repo.visitorsInsideNow(societyId),
    wantRows(p) ? repo.gateRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return {
    period: period(p),
    totalEntries: countOf(totals, 'ENTRY', 'event_type'),
    totalExits: countOf(totals, 'EXIT', 'event_type'),
    visitorsCurrentlyInside: inside.count,
    byGate,
    byDay,
    rows,
  };
};

const getOverstayReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [summary, rows] = await Promise.all([
    repo.overstaySummary(societyId, fromDate, toDate),
    wantRows(p) ? repo.overstayRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return { period: period(p), ...summary, rows };
};

const getDeliveryReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [byStatus, byType, stats, uncollected, rows] = await Promise.all([
    repo.deliveryByStatus(societyId, fromDate, toDate),
    repo.deliveryByType(societyId, fromDate, toDate),
    repo.deliveryStats(societyId, fromDate, toDate),
    repo.parcelsUncollected(societyId),
    wantRows(p) ? repo.deliveryRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return {
    period: period(p),
    totalDeliveries: sum(byStatus),
    byStatus,
    byType,
    avgHandoverMinutes: stats.avg_handover_minutes,
    parcelsStillStored: uncollected.count,
    rows,
  };
};

// ============================================================================
// HELPDESK
// ============================================================================

const getTicketReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [times, byStatus, byPriority, byCategory, rating, rows] = await Promise.all([
    repo.ticketTimes(societyId, fromDate, toDate),
    repo.ticketByStatus(societyId, fromDate, toDate),
    repo.ticketByPriority(societyId, fromDate, toDate),
    repo.ticketByCategory(societyId, fromDate, toDate),
    repo.ticketRatingAvg(societyId, fromDate, toDate),
    wantRows(p) ? repo.ticketRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return {
    period: period(p),
    totalTickets: times.total,
    openTickets: times.open,
    closedTickets: times.closed, // RESOLVED + CLOSED
    avgResponseHours: times.avg_response_hours,
    avgResolutionHours: times.avg_resolution_hours,
    responseTimeDefinition: 'Hours from opened_at to the first status change away from OPEN.',
    avgRating: rating.avg_rating,
    ratedTickets: rating.rated,
    byStatus,
    byPriority,
    byCategory,
    rows,
  };
};

const getSlaReport = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [timers, overdue, rows] = await Promise.all([
    repo.slaTimerStatus(societyId, fromDate, toDate),
    repo.slaOverdueRunning(societyId, fromDate, toDate),
    wantRows(p) ? repo.slaBreachRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  const met = countOf(timers, 'MET');
  const breached = countOf(timers, 'BREACHED');
  return {
    period: period(p),
    totalTimers: sum(timers),
    met,
    breached,
    running: countOf(timers, 'RUNNING'),
    paused: countOf(timers, 'PAUSED'),
    runningButOverdue: overdue.count, // breach not stamped yet (breach is detected on read)
    compliancePercentage: pct(met, met + breached + overdue.count),
    timersByStatus: timers,
    rows,
  };
};

const getCategoryTrends = async (p) => {
  const trends = await repo.categoryTrends(p.societyId, p.fromDate, p.toDate);
  return { period: period(p), trends, rows: trends };
};

// ============================================================================
// VENDORS
// ============================================================================

const getVendorOutstanding = async (p) => {
  const rows = await repo.vendorOutstanding(p.societyId, p.fromDate, p.toDate);
  return {
    period: period(p),
    totalBilled: Number(sum(rows, 'billed').toFixed(2)),
    totalPaid: Number(sum(rows, 'paid').toFixed(2)),
    totalOutstanding: Number(sum(rows, 'outstanding').toFixed(2)),
    totalOverdue: Number(sum(rows, 'overdue').toFixed(2)),
    vendors: rows,
    rows,
  };
};

const getVendorContracts = async (p) => {
  const [status, rows] = await Promise.all([
    repo.contractStatus(p.societyId),
    repo.contractRows(p.societyId, p.expiringInDays, p.limit),
  ]);
  return {
    expiringInDays: p.expiringInDays,
    totalContracts: sum(status),
    totalValue: Number(sum(status, 'value').toFixed(2)),
    byStatus: status,
    expiringSoon: rows.filter((r) => r.expiring_soon).length,
    contracts: rows,
    rows,
  };
};

const getVendorSpend = async (p) => {
  const rows = await repo.vendorSpend(p.societyId, p.fromDate, p.toDate);
  return {
    period: period(p),
    totalPoValue: Number(sum(rows, 'po_total').toFixed(2)),
    totalInvoiced: Number(sum(rows, 'invoiced').toFixed(2)),
    totalPaid: Number(sum(rows, 'paid').toFixed(2)),
    vendors: rows,
    rows,
  };
};

const getVendorSlaPerformance = async (p) => {
  const rows = await repo.vendorSlaPerformance(p.societyId, p.fromDate, p.toDate);
  return { period: period(p), vendors: rows, rows };
};

// ============================================================================
// PROCUREMENT
// ============================================================================

const getProcurementSummary = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [pr, rfq, quotes, po, bills, grn] = await Promise.all([
    repo.prByStatus(societyId, fromDate, toDate),
    repo.rfqByStatus(societyId, fromDate, toDate),
    repo.quotationByStatus(societyId, fromDate, toDate),
    repo.poByStatus(societyId, fromDate, toDate),
    repo.vendorInvoiceByStatus(societyId, fromDate, toDate),
    repo.goodsReceiptByStatus(societyId, fromDate, toDate),
  ]);
  return {
    period: period(p),
    purchaseRequests: { total: sum(pr), estimatedAmount: sum(pr, 'amount'), byStatus: pr },
    rfqs: { total: sum(rfq), byStatus: rfq },
    quotations: { total: sum(quotes), byStatus: quotes },
    purchaseOrders: { total: sum(po), amount: sum(po, 'amount'), byStatus: po },
    goodsReceipts: { total: sum(grn), byStatus: grn },
    vendorBills: { total: sum(bills), amount: sum(bills, 'amount'), byStatus: bills },
  };
};

const getQuotationComparison = async (p) => {
  const rfq = await repo.findRfqForSociety(p.societyId, p.rfqId);
  if (!rfq) throw new ApiError(404, 'RFQ not found in this society');
  const [quotations, scores] = await Promise.all([repo.rfqQuotations(p.rfqId), repo.rfqScores(p.rfqId)]);
  const lowest = quotations.length ? quotations[0].total : null;
  const rows = quotations.map((q) => {
    const own = scores.filter((s) => s.vendor_id === q.vendor_id);
    const totalScore = own.reduce((a, s) => a + Number(s.score || 0), 0);
    return {
      ...q,
      isLowestQuote: lowest !== null && q.total === lowest,
      criteriaScores: own,
      totalScore: Number(totalScore.toFixed(2)),
    };
  });
  return { rfq, quotationCount: rows.length, lowestQuote: lowest, quotations: rows, rows };
};

const listProcurementRfqs = (societyId) => repo.rfqsForSociety(societyId);

const getPurchaseOrderReport = async (p) => {
  const rows = await repo.poRows(p.societyId, p.fromDate, p.toDate, p.limit);
  return { period: period(p), count: rows.length, totalValue: Number(sum(rows, 'total').toFixed(2)), purchaseOrders: rows, rows };
};

const getVendorBillReport = async (p) => {
  const rows = await repo.vendorBillRows(p.societyId, p.fromDate, p.toDate, p.limit);
  return { period: period(p), count: rows.length, totalValue: Number(sum(rows, 'total').toFixed(2)), vendorBills: rows, rows };
};

// ============================================================================
// AMENITIES (period filters by slot date)
// ============================================================================

const getAmenityUtilization = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [amenities, weekday] = await Promise.all([
    repo.amenityUtilization(societyId, fromDate, toDate),
    repo.amenityWeekday(societyId, fromDate, toDate),
  ]);
  const capacity = sum(amenities, 'capacity');
  const booked = sum(amenities, 'booked');
  const cancelled = sum(amenities, 'cancelled');
  return {
    period: period(p),
    totalCapacity: capacity,
    totalBooked: booked,
    overallUtilizationPercentage: pct(booked, capacity),
    totalRevenue: Number(sum(amenities, 'revenue').toFixed(2)),
    totalCancellations: cancelled,
    totalExpired: sum(amenities, 'expired'),
    totalNoShows: sum(amenities, 'no_shows'),
    cancellationRate: pct(cancelled, booked + cancelled),
    utilizationNote: 'Utilization counts one booking against one unit of slot capacity.',
    byAmenity: amenities,
    peakDemandByWeekday: weekday.map((w) => ({
      weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w.weekday],
      bookings: w.bookings,
    })),
    rows: amenities,
  };
};

const getAmenityBookings = async (p) => {
  const rows = await repo.amenityBookingRows(p.societyId, p.fromDate, p.toDate, p.limit);
  return { period: period(p), count: rows.length, bookings: rows, rows };
};

// ============================================================================
// UTILITIES
// ============================================================================

const getUtilitySummary = async (p) => {
  const { societyId, fromDate, toDate } = p;
  const [meters, bills, readings, rows] = await Promise.all([
    repo.metersByTypeStatus(societyId),
    repo.utilityBills(societyId, fromDate, toDate),
    repo.readingsByStatus(societyId, fromDate, toDate),
    wantRows(p) ? repo.utilityBillRows(societyId, fromDate, toDate, p.limit) : [],
  ]);
  return {
    period: period(p),
    totalMeters: sum(meters),
    metersByTypeAndStatus: meters,
    readingsByStatus: readings,
    billing: {
      totalBills: sum(bills, 'bills'),
      totalConsumption: Number(sum(bills, 'consumption').toFixed(2)),
      totalAmount: Number(sum(bills, 'amount').toFixed(2)),
      byUtilityAndStatus: bills,
    },
    rows,
  };
};

module.exports = {
  getDashboard,
  getVehicleReport, getParkingReport,
  getVisitorReport, getGateActivityReport, getOverstayReport, getDeliveryReport,
  getTicketReport, getSlaReport, getCategoryTrends,
  getVendorOutstanding, getVendorContracts, getVendorSpend, getVendorSlaPerformance,
  getProcurementSummary, getQuotationComparison, listProcurementRfqs, getPurchaseOrderReport, getVendorBillReport,
  getAmenityUtilization, getAmenityBookings,
  getUtilitySummary,
};
