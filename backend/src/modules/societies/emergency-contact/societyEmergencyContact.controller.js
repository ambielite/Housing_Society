const service = require("./societyEmergencyContact.service");

const sendError = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || "Could not process emergency contact request." });

const list = async (req, res) => {
  try {
    const result = await service.listContacts(req.user.societyId);
    res.json({ success: true, data: result.contacts, society: result.society });
  } catch (error) { sendError(res, error); }
};

const create = async (req, res) => {
  try {
    const contact = await service.createContact(req.user.societyId, req.body);
    res.status(201).json({ success: true, message: "Emergency contact added.", data: contact });
  } catch (error) { sendError(res, error); }
};

const update = async (req, res) => {
  try {
    const contact = await service.updateContact(req.params.id, req.user.societyId, req.body);
    res.json({ success: true, message: "Emergency contact updated.", data: contact });
  } catch (error) { sendError(res, error); }
};

const remove = async (req, res) => {
  try {
    await service.deleteContact(req.params.id, req.user.societyId);
    res.json({ success: true, message: "Emergency contact removed." });
  } catch (error) { sendError(res, error); }
};

module.exports = { list, create, update, remove };
