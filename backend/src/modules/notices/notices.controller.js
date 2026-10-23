const service = require('./notices.service');

const respond = (handler, successStatus = 200) => async (req, res) => {
  try {
    const data = await handler(req);
    res.status(successStatus).json({ success: true, data });
  } catch (error) {
    const status = error.message === 'Notice not found' || error.message === 'Notice template not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = {
  list: respond((req) => service.list(req.user.societyId, req.query)),
  get: respond((req) => service.getById(req.user.societyId, req.params.id)),
  create: respond((req) => service.create(req.user.societyId, req.user.id, req.body), 201),
  update: respond((req) => service.update(req.user.societyId, req.user.id, req.params.id, req.body)),
  markRead: respond((req) => service.markRead(req.user.societyId, req.user.id, req.params.id)),
  expire: respond((req) => service.expire(req.user.societyId, req.user.id, req.params.id)),
  renotify: respond((req) => service.renotify(req.user.societyId, req.params.id)),
  saveTemplate: respond((req) => service.saveTemplate(req.user.societyId, req.user.id, req.params.id), 201),
  templates: respond((req) => service.templates(req.user.societyId)),
  createFromTemplate: respond((req) => service.createFromTemplate(req.user.societyId, req.user.id, req.params.templateId, req.body), 201),
};
