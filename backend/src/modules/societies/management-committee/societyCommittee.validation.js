const DESIGNATIONS = ["CHAIRPERSON", "VICE_CHAIRPERSON", "SECRETARY", "JOINT_SECRETARY", "TREASURER", "COMMITTEE_MEMBER", "OTHER"];
const PHONE_PATTERN = /^[+\d][\d\s().-]{5,28}$/;

const validateMember = (req, res, next) => {
  const { memberName, designation, phone, email, termStart, termEnd, isActive } = req.body || {};
  const errors = [];
  if (typeof memberName !== "string" || !memberName.trim() || memberName.trim().length > 140) errors.push("Member name is required and must be at most 140 characters.");
  if (!DESIGNATIONS.includes(designation)) errors.push("Select a valid committee designation.");
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) errors.push("Enter a valid phone number.");
  if (email && (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.push("Enter a valid email address.");
  for (const [field, label] of [[termStart, "Term start"], [termEnd, "Term end"]]) {
    if (field && (typeof field !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(field) || Number.isNaN(Date.parse(`${field}T00:00:00Z`)))) errors.push(`${label} must be a valid date.`);
  }
  if (termStart && termEnd && termEnd < termStart) errors.push("Term end must be on or after the term start.");
  if (isActive !== undefined && typeof isActive !== "boolean") errors.push("Active status must be true or false.");
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(" "), details: errors });
  req.body.memberName = memberName.trim();
  req.body.phone = phone.trim();
  next();
};

module.exports = { DESIGNATIONS, validateMember };
