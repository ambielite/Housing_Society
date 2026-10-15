export const REPORT_GROUPS = [
  {
    key: 'dashboard', label: 'Executive dashboard', permission: 'REPORT_DASHBOARD_READ', reports: [
      { key: 'dashboard', label: 'Executive dashboard', title: 'Executive dashboard', description: 'A current snapshot of vehicles, parking, security, workflow, vendors, amenities and utilities.', permission: 'REPORT_DASHBOARD_READ', exportable: false, dates: false },
    ],
  },
  {
    key: 'operations', label: 'Operations', permission: 'REPORT_OPERATIONS_READ', reports: [
      { key: 'vehicles', label: 'Vehicle report', title: 'Vehicle report', permission: 'REPORT_OPERATIONS_READ', exportKey: 'vehicles', dates: false },
      { key: 'parking', label: 'Parking report', title: 'Parking report', permission: 'REPORT_OPERATIONS_READ', exportable: false, dates: true },
    ],
  },
  {
    key: 'security', label: 'Security', permission: 'REPORT_SECURITY_READ', reports: [
      { key: 'visitors', label: 'Visitor activity', title: 'Visitor activity report', permission: 'REPORT_SECURITY_READ', exportKey: 'visitors', dates: true },
      { key: 'gate-activity', label: 'Gate activity', title: 'Gate activity report', permission: 'REPORT_SECURITY_READ', exportKey: 'gate-activity', dates: true },
      { key: 'overstay', label: 'Overstay alerts', title: 'Overstay report', permission: 'REPORT_SECURITY_READ', exportKey: 'overstay', dates: true },
      { key: 'deliveries', label: 'Deliveries', title: 'Delivery report', permission: 'REPORT_SECURITY_READ', exportKey: 'deliveries', dates: true },
    ],
  },
  {
    key: 'helpdesk', label: 'Helpdesk', permission: 'REPORT_HELPDESK_READ', reports: [
      { key: 'tickets', label: 'Tickets', title: 'Helpdesk ticket report', permission: 'REPORT_HELPDESK_READ', exportKey: 'tickets', dates: true },
      { key: 'sla', label: 'SLA compliance', title: 'SLA compliance report', permission: 'REPORT_HELPDESK_READ', exportKey: 'sla-breaches', dates: true },
      { key: 'category-trends', label: 'Category trends', title: 'Ticket category trends', permission: 'REPORT_HELPDESK_READ', exportKey: 'category-trends', dates: true },
    ],
  },
  {
    key: 'vendors', label: 'Vendors', permission: 'REPORT_VENDOR_READ', reports: [
      { key: 'vendor-outstanding', label: 'Outstanding invoices', title: 'Vendor outstanding report', permission: 'REPORT_VENDOR_READ', exportKey: 'vendor-outstanding', dates: false },
      { key: 'vendor-contracts', label: 'Contracts & expiry', title: 'Vendor contract report', permission: 'REPORT_VENDOR_READ', exportKey: 'vendor-contracts', dates: false, expiringDays: true },
      { key: 'vendor-spend', label: 'Vendor spend', title: 'Vendor spend report', permission: 'REPORT_VENDOR_READ', exportKey: 'vendor-spend', dates: true },
      { key: 'vendor-sla-performance', label: 'SLA performance', title: 'Vendor SLA performance', permission: 'REPORT_VENDOR_READ', exportKey: 'vendor-sla-performance', dates: true },
    ],
  },
  {
    key: 'procurement', label: 'Procurement', permission: 'REPORT_PROCUREMENT_READ', reports: [
      { key: 'procurement-summary', label: 'Procurement summary', title: 'Procurement summary', permission: 'REPORT_PROCUREMENT_READ', exportable: false, dates: true },
      { key: 'quotation-comparison', label: 'Quotation comparison', title: 'RFQ quotation comparison', permission: 'REPORT_PROCUREMENT_READ', exportKey: 'quotation-comparison', dates: false, rfqId: true },
      { key: 'purchase-orders', label: 'Purchase orders', title: 'Purchase order report', permission: 'REPORT_PROCUREMENT_READ', exportKey: 'purchase-orders', dates: true },
      { key: 'vendor-bills', label: 'Vendor bills', title: 'Vendor bill report', permission: 'REPORT_PROCUREMENT_READ', exportKey: 'vendor-bills', dates: true },
    ],
  },
  {
    key: 'amenities', label: 'Amenities', permission: 'REPORT_AMENITY_READ', reports: [
      { key: 'amenity-utilization', label: 'Utilization & revenue', title: 'Amenity utilization report', permission: 'REPORT_AMENITY_READ', exportKey: 'amenity-utilization', dates: true },
      { key: 'amenity-bookings', label: 'Bookings', title: 'Amenity bookings report', permission: 'REPORT_AMENITY_READ', exportKey: 'amenity-bookings', dates: true },
    ],
  },
  {
    key: 'utilities', label: 'Utilities', permission: 'REPORT_UTILITY_READ', reports: [
      { key: 'utility-summary', label: 'Consumption & bills', title: 'Utility consumption and billing', permission: 'REPORT_UTILITY_READ', exportKey: 'utility-bills', dates: true },
    ],
  },
];

export const REPORT_BY_KEY = Object.fromEntries(REPORT_GROUPS.flatMap((group) => group.reports.map((report) => [report.key, report])));
