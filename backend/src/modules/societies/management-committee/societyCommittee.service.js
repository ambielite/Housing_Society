const repository = require("./societyCommittee.repository");
const Society = require("../society/society.model");
const { saveProfilePicture, removeProfilePicture } = require("../../users/profilePicture.storage");

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

const createMember = async (societyId, data, profilePicture) => {
  await ensureSociety(societyId);
  const profilePictureUrl = profilePicture ? saveProfilePicture(profilePicture) : null;
  try {
    return await repository.create({ ...pickFields(data), profilePictureUrl, societyId });
  } catch (error) {
    removeProfilePicture(profilePictureUrl);
    throw error;
  }
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

const updateMember = async (societyId, id, data, profilePicture) => {
  const member = await getMember(societyId, id);
  const previousPictureUrl = member.profilePictureUrl;
  const profilePictureUrl = profilePicture ? saveProfilePicture(profilePicture) : undefined;
  try {
    const updated = await member.update({ ...pickFields(data), ...(profilePictureUrl ? { profilePictureUrl } : {}) });
    if (profilePictureUrl) removeProfilePicture(previousPictureUrl);
    return updated;
  } catch (error) {
    removeProfilePicture(profilePictureUrl);
    throw error;
  }
};

const deleteMember = async (societyId, id) => {
  const member = await getMember(societyId, id);
  await repository.remove(member);
  removeProfilePicture(member.profilePictureUrl);
};

module.exports = { listMembers, createMember, updateMember, deleteMember };
