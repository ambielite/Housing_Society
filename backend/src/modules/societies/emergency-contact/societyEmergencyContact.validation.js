const CATEGORIES = ["POLICE", "FIRE", "AMBULANCE", "HOSPITAL", "SECURITY", "ELECTRICITY", "WATER", "GAS", "DISASTER_RESPONSE", "SOCIETY_OFFICE", "OTHER"];
const PHONE_PATTERN = /^[+\d][\d\s().-]{5,28}$/;

const validateContact = (req, res, next) => {
  const { name, category, phone, alternatePhone, email, available24x7, isActive } = req.body || {};
  const errors = [];
  if (typeof name !== "string" || !name.trim() || name.trim().length > 140) errors.push("Name is required and must be at most 140 characters.");
  if (!CATEGORIES.includes(category)) errors.push("Select a valid emergency contact category.");
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) errors.push("Enter a valid primary phone number.");
  if (alternatePhone && (typeof alternatePhone !== "string" || !PHONE_PATTERN.test(alternatePhone.trim()))) errors.push("Enter a valid alternate phone number.");
  if (email && (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.push("Enter a valid email address.");
  if (available24x7 !== undefined && typeof available24x7 !== "boolean") errors.push("24/7 availability must be true or false.");
  if (isActive !== undefined && typeof isActive !== "boolean") errors.push("Active status must be true or false.");
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(" "), details: errors });
  req.body.name = name.trim();
  req.body.phone = phone.trim();
  if (alternatePhone) req.body.alternatePhone = alternatePhone.trim();
  next();
};

module.exports = { CATEGORIES, validateContact };
