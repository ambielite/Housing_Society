const SocietyEmergencyContact = require("./societyEmergencyContact.model");

const list = (societyId) => SocietyEmergencyContact.findAll({
  where: { societyId },
  order: [["isActive", "DESC"], ["category", "ASC"], ["name", "ASC"]],
});

const findById = (id, societyId) => SocietyEmergencyContact.findOne({ where: { id, societyId } });
const create = (data) => SocietyEmergencyContact.create(data);
const remove = (contact) => contact.destroy();

module.exports = { list, findById, create, remove };
