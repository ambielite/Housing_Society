const roleLabels = {
  SOCIETY_ADMIN: 'Society Admin',
  ADMIN: 'Society Admin',
  SUPER_ADMIN: 'Super Admin',
  SOCIETY_MANAGER: 'Society Manager',
};

const formatAdminLabel = (actor) => {
  const name = [actor?.firstName, actor?.lastName].filter(Boolean).join(' ').trim() || 'Administrator';
  const roleCode = actor?.roles?.find((role) => roleLabels[role]) || actor?.roles?.[0];
  const role = roleLabels[roleCode] || String(roleCode || 'Administrator')
    .toLowerCase().split('_').map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word).join(' ');
  return `${name} (${role})`;
};

const fieldLabels = {
  firstName: 'name', lastName: 'name', mobileNumber: 'phone number',
  phone: 'phone number', email: 'email', employeeCode: 'employee code',
  dateOfBirth: 'date of birth', joiningDate: 'joining date',
  designation: 'designation', department: 'department', status: 'account status',
  emergencyContactName: 'emergency contact', emergencyContactNumber: 'emergency contact number',
  address: 'address', photoPath: 'profile photo', profilePicture: 'profile photo',
  profilePictureUrl: 'profile photo', remarks: 'notes',
};

const changedFieldLabels = (changes = {}) => [...new Set(
  Object.keys(changes).map((field) => fieldLabels[field]).filter(Boolean),
)];

module.exports = { formatAdminLabel, changedFieldLabels };
