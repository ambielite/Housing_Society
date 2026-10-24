const { Op } = require("sequelize");

const assertUniqueEmail = async ({ model, email, field = "email", where = {}, excludeId, message }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return;

  const match = await model.findOne({
    where: {
      ...where,
      [field]: { [Op.iLike]: normalizedEmail },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: ["id"],
  });

  if (match) {
    const error = new Error(message || "This email address is already in use.");
    error.status = 409;
    throw error;
  }
};

module.exports = assertUniqueEmail;
