const ApiError = require('../../common/ApiError');
const repository = require('./sla.repository');

/**
 * SLA breach detection and escalation firing are both implemented as
 * check-on-read (no background scheduler exists yet - same pattern used
 * consistently across every phase of this project). The computation
 * runs whenever a ticket/timer is fetched, so anything actively being
 * looked at always reflects accurate breach/escalation state. The known
 * trade-off: a ticket nobody looks at can sit breached with nothing
 * proactively alerting anyone - acceptable for now, but escalation
 * specifically should move to a real timer + notification once a job
 * scheduler and the Notifications module (a different phase) both exist.
 */

const MINUTE_MS = 60 * 1000;

const startTimer = async (ticketId, slaPolicy) => {
  const now = Date.now();
  const responseDueAt = new Date(now + slaPolicy.response_minutes * MINUTE_MS);
  const resolutionDueAt = new Date(now + slaPolicy.resolution_minutes * MINUTE_MS);
  return repository.createTimer({ ticketId, slaPolicyId: slaPolicy.id, responseDueAt, resolutionDueAt });
};

const pauseTimer = async (ticketId) => {
  const timer = await repository.findTimerByTicketId(ticketId);
  if (!timer || timer.status !== 'RUNNING') {
    return timer;
  }
  return repository.updateTimer(timer.id, { paused_at: new Date(), status: 'PAUSED' });
};

/** Resuming extends both due dates by however long the timer was paused. */
const resumeTimer = async (ticketId) => {
  const timer = await repository.findTimerByTicketId(ticketId);
  if (!timer || timer.status !== 'PAUSED' || !timer.paused_at) {
    return timer;
  }
  const pausedDurationMs = Date.now() - new Date(timer.paused_at).getTime();
  const newResponseDue = timer.response_due_at
    ? new Date(new Date(timer.response_due_at).getTime() + pausedDurationMs)
    : null;
  const newResolutionDue = new Date(new Date(timer.resolution_due_at).getTime() + pausedDurationMs);

  return repository.updateTimer(timer.id, {
    resumed_at: new Date(),
    response_due_at: newResponseDue,
    resolution_due_at: newResolutionDue,
    status: 'RUNNING',
  });
};

/** Check-on-read: flips a RUNNING/PAUSED timer to BREACHED if its resolution due date has passed. */
const checkAndUpdateBreach = async (timer) => {
  if (!timer) return timer;
  if ((timer.status === 'RUNNING' || timer.status === 'PAUSED') && !timer.breached_at) {
    if (timer.resolution_due_at && new Date(timer.resolution_due_at) < new Date()) {
      return repository.updateTimer(timer.id, { breached_at: new Date(), status: 'BREACHED' });
    }
  }
  return timer;
};

const markMet = async (ticketId) => {
  const timer = await repository.findTimerByTicketId(ticketId);
  if (!timer || timer.status === 'BREACHED') {
    return timer;
  }
  return repository.updateTimer(timer.id, { status: 'MET' });
};

/**
 * Check-on-read escalation firing. Evaluates every escalation_rules row
 * for this timer's SLA policy and creates a ticket_escalations record
 * the first time each rule's condition becomes true; never re-fires the
 * same rule twice for the same ticket (checked via findEscalation).
 */
const fireEscalations = async (ticketId, timer) => {
  if (!timer) return;
  const rules = await repository.listRulesForPolicy(timer.sla_policy_id);
  const now = Date.now();
  const resolutionDueMs = timer.resolution_due_at ? new Date(timer.resolution_due_at).getTime() : null;
  const breachedMs = timer.breached_at ? new Date(timer.breached_at).getTime() : null;

  for (const rule of rules) {
    let conditionMet = false;

    if (rule.threshold_type === 'WARNING_BEFORE_BREACH' && !breachedMs && resolutionDueMs) {
      conditionMet = resolutionDueMs - now <= rule.threshold_value * MINUTE_MS;
    } else if (rule.threshold_type === 'AT_BREACH') {
      conditionMet = !!breachedMs;
    } else if (rule.threshold_type === 'MINUTES_AFTER_BREACH' && breachedMs) {
      conditionMet = now - breachedMs >= rule.threshold_value * MINUTE_MS;
    }

    if (conditionMet) {
      const existing = await repository.findEscalation(ticketId, rule.id);
      if (!existing) {
        await repository.createEscalation({ ticketId, escalationRuleId: rule.id, escalatedTo: rule.target_user_id });
      }
    }
  }
};

/** Full check-on-read pass: breach detection, then escalation firing, for one ticket. */
const refreshTicketSla = async (ticketId) => {
  const timer = await repository.findTimerByTicketId(ticketId);
  if (!timer) return null;
  const updated = await checkAndUpdateBreach(timer);
  await fireEscalations(ticketId, updated);
  return updated;
};

const getTimerForTicket = async (ticketId) => {
  const timer = await refreshTicketSla(ticketId);
  if (!timer) {
    throw new ApiError(404, 'No SLA timer found for this ticket');
  }
  return timer;
};

const listEscalationsForTicket = async (ticketId) => {
  await refreshTicketSla(ticketId);
  return repository.listEscalationsForTicket(ticketId);
};

const acknowledgeEscalation = async (id) => {
  const escalation = await repository.findEscalationById(id);
  if (!escalation) {
    throw new ApiError(404, 'Escalation not found');
  }
  if (escalation.status !== 'OPEN') {
    throw new ApiError(400, `This escalation is already ${escalation.status}`);
  }
  return repository.acknowledgeEscalation(id);
};

const resolveEscalation = async (id) => {
  const escalation = await repository.findEscalationById(id);
  if (!escalation) {
    throw new ApiError(404, 'Escalation not found');
  }
  return repository.resolveEscalation(id);
};

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  checkAndUpdateBreach,
  markMet,
  fireEscalations,
  refreshTicketSla,
  getTimerForTicket,
  listEscalationsForTicket,
  acknowledgeEscalation,
  resolveEscalation,
};
