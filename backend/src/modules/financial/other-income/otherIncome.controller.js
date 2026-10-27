const service = require('./otherIncome.service');
const sendError = (res, error) => res.status(error.statusCode || 400).json({ success: false, message: error.message });

exports.list = async (req, res) => {
  try { return res.json({ success: true, data: await service.list(req.query.societyId, req.query) }); }
  catch (error) { return sendError(res, error); }
};

exports.create = async (req, res) => {
  try { return res.status(201).json({ success: true, data: await service.create({ ...req.body, createdBy: req.user?.id }) }); }
  catch (error) { return sendError(res, error); }
};
