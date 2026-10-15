// A VENDOR login stays row-scoped even when it also has non-staff roles.
// Explicit staff/admin roles retain their existing broader access.
const elevatedRoles = new Set([
  'SUPER_ADMIN',
  'SOCIETY_ADMIN',
  'FACILITY_MANAGER',
  'HELPDESK_MANAGER',
  'PRESIDENT_SECRETARY',
  'SECURITY_HEAD',
  'AUDITOR',
  'VIEW_ONLY',
  'TREASURER',
  'ACCOUNTANT',
]);

const isVendorScoped = (user) => Boolean(
  user?.roles?.includes('VENDOR') && !user.roles.some((role) => elevatedRoles.has(role))
);

const getVendorIds = (user) => {
  if (Array.isArray(user?.vendorIds)) return user.vendorIds;
  return user?.vendorId ? [user.vendorId] : [];
};

module.exports = { isVendorScoped, getVendorIds };
