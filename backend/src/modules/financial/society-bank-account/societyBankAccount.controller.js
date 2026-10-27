const service = require('./societyBankAccount.service');

const sendError = (res, error) => res.status(error.statusCode || 400).json({ success: false, message: error.message });

const list = async (req, res) => {
  try { return res.json({ success: true, data: await service.list(req.query.societyId) }); }
  catch (error) { return sendError(res, error); }
};

const create = async (req, res) => {
  try { return res.status(201).json({ success: true, data: await service.create(req.body) }); }
  catch (error) { return sendError(res, error); }
};

const update = async (req, res) => {
  try { return res.json({ success: true, data: await service.update(req.params.id, req.body.societyId, req.body) }); }
  catch (error) { return sendError(res, error); }
};

const deactivate = async (req, res) => {
  try { return res.json({ success: true, data: await service.deactivate(req.params.id, req.body.societyId) }); }
  catch (error) { return sendError(res, error); }
};

module.exports = { list, create, update, deactivate };
