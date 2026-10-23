const repository = require("./societyEmergencyContact.repository");
const Society = require("../society/society.model");

const allowedFields = ["name", "category", "phone", "alternatePhone", "email", "address", "operatingHours", "available24x7", "notes", "isActive"];
const pickFields = (data) => Object.fromEntries(allowedFields
  .filter((key) => data[key] !== undefined)
  .map((key) => {
    const value = data[key];
    return [key, typeof value === "string" && value.trim() === "" && !["name", "category", "phone"].includes(key)
      ? null
      : typeof value === "string" ? value.trim() : value];
  }));
const requireSociety = async (societyId) => {
  if (!societyId) {
    const error = new Error("Select a society before managing emergency contacts.");
    error.status = 400;
    throw error;
  }
  const society = await Society.findByPk(societyId, { attributes: ["id", "name", "address"] });
  if (!society) {
    const error = new Error("Society not found.");
    error.status = 404;
    throw error;
  }
  return society;
};

const listContacts = async (societyId) => {
  const society = await requireSociety(societyId);
  const contacts = await repository.list(societyId);
  return { society, contacts };
};

const createContact = async (societyId, data) => {
  await requireSociety(societyId);
  return repository.create({ ...pickFields(data), societyId });
};

const getContact = async (id, societyId) => {
  await requireSociety(societyId);
  const contact = await repository.findById(id, societyId);
  if (!contact) {
    const error = new Error("Emergency contact not found.");
    error.status = 404;
    throw error;
  }
  return contact;
};

const updateContact = async (id, societyId, data) => {
  const contact = await getContact(id, societyId);
  return contact.update(pickFields(data));
};

const deleteContact = async (id, societyId) => {
  const contact = await getContact(id, societyId);
  await repository.remove(contact);
};

module.exports = { listContacts, createContact, updateContact, deleteContact };
