const service = require("./societyCommittee.service");
const sendError = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || "Could not process committee member request." });

const list = async (req, res) => {
  try {
    const result = await service.listMembers(req.user.societyId);
    res.json({ success: true, data: result.members, society: result.society });
  } catch (error) { sendError(res, error); }
};
const create = async (req, res) => {
  try {
    const member = await service.createMember(req.user.societyId, req.body);
    res.status(201).json({ success: true, message: "Committee member addedd.", data: member });
  } catch (error) { sendError(res, error); }
};
const update = async (req, res) => {
  try {
    const member = await service.updateMember(req.user.societyId, req.params.id, req.body);
    res.json({ success: true, message: "Committee member updated.", data: member });
  } catch (error) { sendError(res, error); }
};
const remove = async (req, res) => {
  try {
    await service.deleteMember(req.user.societyId, req.params.id);
    res.json({ success: true, message: "Committee member removed." });
  } catch (error) { sendError(res, error); }
};

module.exports = { list, create, update, remove };
