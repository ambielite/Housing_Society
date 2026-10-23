const SocietyCommitteeMember = require("./societyCommittee.model");

const list = (societyId) => SocietyCommitteeMember.findAll({
  where: { societyId },
  order: [["isActive", "DESC"], ["designation", "ASC"], ["memberName", "ASC"]],
});
const findById = (societyId, id) => SocietyCommitteeMember.findOne({ where: { societyId, id } });
const create = (data) => SocietyCommitteeMember.create(data);
const remove = (member) => member.destroy();

module.exports = { list, findById, create, remove };
