const repository = require("./societyCommittee.repository");
const Society = require("../society/society.model");

const writableFields = ["memberName", "designation", "unitNumber", "phone", "email", "termStart", "termEnd", "notes", "isActive"];
const pickFields = (data) => Object.fromEntries(writableFields
  .filter((key) => data[key] !== undefined)
  .map((key) => [key, typeof data[key] === "string" ? data[key].trim() || null : data[key]]));

const ensureSociety = async (societyId) => {
  if (!societyId) {
    const error = new Error("Select a society before managing its committee.");
    error.status = 400;
    throw error;
  }
  const society = await Society.findByPk(societyId, { attributes: ["id", "name"] });
  if (!society) {
    const error = new Error("Society not found.");
    error.status = 404;
    throw error;
  }
  return society;
};

const listMembers = async (societyId) => {
  const society = await ensureSociety(societyId);
  return { society, members: await repository.list(societyId) };
};

const createMember = async (societyId, data) => {
  await ensureSociety(societyId);
  return repository.create({ ...pickFields(data), societyId });
};

const getMember = async (societyId, id) => {
  await ensureSociety(societyId);
  const member = await repository.findById(societyId, id);
  if (!member) {
    const error = new Error("Committee member not found.");
    error.status = 404;
    throw error;
  }
  return member;
};

const updateMember = async (societyId, id, data) => {
  const member = await getMember(societyId, id);
  return member.update(pickFields(data));
};

const deleteMember = async (societyId, id) => repository.remove(await getMember(societyId, id));

module.exports = { listMembers, createMember, updateMember, deleteMember };
