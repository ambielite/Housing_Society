const repository = require('./notices.repository');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const validDate = (value, label) => {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} must be a valid date`);
  return parsed.toISOString();
};

const cleanNotice = ({ title, description, scheduledAt, expiresAt }) => {
  const cleanTitle = String(title || '').trim();
  const cleanDescription = String(description || '').trim();
  if (!cleanTitle || cleanTitle.length > 255) throw new Error('Title is required and must be 255 characters or fewer');
  if (!cleanDescription) throw new Error('Description is required');
  const scheduled = validDate(scheduledAt, 'Scheduled date');
  const expires = validDate(expiresAt, 'Expiry date');
  if (scheduled && new Date(scheduled) <= new Date()) throw new Error('Scheduled date must be in the future');
  if (expires && new Date(expires) <= new Date(scheduled || Date.now())) {
    throw new Error('Expiry date must be after the scheduled or posting date');
  }
  return { title: cleanTitle, description: cleanDescription, scheduledAt: scheduled, expiresAt: expires };
};

const requireUuid = (id, label) => {
  if (!isUuid(id)) throw new Error(`Invalid ${label}`);
};

const list = async (societyId, query = {}) => {
  requireUuid(societyId, 'society');
  const tab = ['current', 'upcoming', 'expired'].includes(String(query.tab || '').toLowerCase())
    ? String(query.tab).toLowerCase() : 'current';
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const result = await repository.list({ societyId, tab, search: String(query.search || '').trim().slice(0, 200), limit, offset: (page - 1) * limit });
  return { ...result, page, limit, tab };
};

const getById = async (societyId, id) => {
  requireUuid(id, 'notice ID');
  const notice = await repository.findById(societyId, id);
  if (!notice) throw new Error('Notice not found');
  return notice;
};

const create = async (societyId, userId, data) => {
  requireUuid(societyId, 'society');
  const values = cleanNotice(data);
  return repository.create({ societyId, createdBy: userId, ...values });
};

const update = async (societyId, userId, id, data) => {
  requireUuid(id, 'notice ID');
  const existing = await getById(societyId, id);
  if (existing.status === 'EXPIRED') throw new Error('Expired notices cannot be edited');
  const values = cleanNotice(data);
  const notice = await repository.update({ societyId, id, updatedBy: userId, ...values });
  if (!notice) throw new Error('Notice not found');
  if (existing.status === 'SCHEDULED' && !values.scheduledAt) {
    notice.queued_count = await repository.queueNoticeNotifications(societyId, notice);
  }
  return notice;
};

const markRead = async (societyId, userId, id) => {
  requireUuid(id, 'notice ID');
  const read = await repository.markRead(societyId, id, userId);
  if (!read) throw new Error('Notice is not currently available');
  return read;
};

const expire = async (societyId, userId, id) => {
  requireUuid(id, 'notice ID');
  const notice = await repository.expire(societyId, id, userId);
  if (!notice) throw new Error('Notice not found or already expired');
  return notice;
};

const renotify = async (societyId, id) => {
  requireUuid(id, 'notice ID');
  const notice = await repository.renotify(societyId, id);
  if (!notice) throw new Error('Only an active current notice can be re-notified');
  return notice;
};

const saveTemplate = async (societyId, userId, id) => {
  const notice = await getById(societyId, id);
  return repository.saveTemplate(societyId, userId, notice.title, notice.description);
};

const templates = async (societyId) => repository.listTemplates(societyId);

const createFromTemplate = async (societyId, userId, templateId, data = {}) => {
  requireUuid(templateId, 'template ID');
  const template = await repository.findTemplate(societyId, templateId);
  if (!template) throw new Error('Notice template not found');
  return create(societyId, userId, { ...template, ...data });
};

const processSchedule = async () => repository.publishDue();

module.exports = { list, getById, create, update, markRead, expire, renotify, saveTemplate, templates, createFromTemplate, processSchedule };
