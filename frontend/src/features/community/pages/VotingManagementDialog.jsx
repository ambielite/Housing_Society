import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, UserPlus, Users, X } from 'lucide-react';
import communityApi from '../api/community.api';

const rowsFrom = (response) => {
  const result = response?.data ?? response;
  if (Array.isArray(result)) return result;
  return result?.rows || result?.records || result?.items || result?.data || [];
};
const displayName = (account) => account.displayName || [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email || 'Account';
const errorMessage = (error) => error.response?.data?.message || error.message || 'Could not complete the voting request.';

export default function VotingManagementDialog({ voting, onClose, onChanged }) {
  const votingId = voting.id || voting.uuid;
  const [options, setOptions] = useState([]);
  const [eligibleVoters, setEligibleVoters] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [audit, setAudit] = useState([]);
  const [optionForm, setOptionForm] = useState({ optionCode: '', optionLabel: '', candidateUserId: '' });
  const [voterForm, setVoterForm] = useState({ userId: '', memberType: 'OWNER' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isElection = String(voting.votingType).toUpperCase() === 'ELECTION';
  const base = `/community-voting/${votingId}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [optionsResult, votersResult, accountsResult, auditResult] = await Promise.allSettled([
      communityApi.get(`${base}/options`),
      communityApi.get(`${base}/eligible-voters`),
      communityApi.get(`${base}/voter-candidates`),
      communityApi.get(`${base}/audit`),
    ]);
    const failed = [optionsResult, votersResult, accountsResult, auditResult].find((result) => result.status === 'rejected');
    if (optionsResult.status === 'fulfilled') setOptions(rowsFrom(optionsResult.value));
    if (votersResult.status === 'fulfilled') setEligibleVoters(rowsFrom(votersResult.value));
    if (accountsResult.status === 'fulfilled') setAccounts(rowsFrom(accountsResult.value));
    if (auditResult.status === 'fulfilled') setAudit(rowsFrom(auditResult.value));
    if (failed) setError(errorMessage(failed.reason));
    setLoading(false);
  }, [base]);

  useEffect(() => { void load(); }, [load]);

  const run = async (request) => {
    setBusy(true);
    setError('');
    try {
      await request();
      await load();
      onChanged?.();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const addOption = (event) => {
    event.preventDefault();
    const payload = { optionCode: optionForm.optionCode.trim(), optionLabel: optionForm.optionLabel.trim() };
    if (isElection) payload.candidateUserId = optionForm.candidateUserId;
    void run(async () => {
      await communityApi.post(`${base}/options`, payload);
      setOptionForm({ optionCode: '', optionLabel: '', candidateUserId: '' });
    });
  };

  const addVoter = (event) => {
    event.preventDefault();
    void run(() => communityApi.post(`${base}/eligible-voters`, voterForm));
  };

  const reviewCandidate = (option, approved) => {
    const reason = approved ? undefined : window.prompt('Reason for rejecting this candidate:');
    if (!approved && !reason?.trim()) return;
    void run(() => communityApi.post(`${base}/candidates/${option.id}/review`, { approved, reason }));
  };

  const verifyIdentity = (voter, verified) => {
    void run(() => communityApi.post(`${base}/eligibility/${voter.id}/identity`, { verified }));
  };

  return (
    <div className="society-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section className="society-form-modal security-record-modal community-record-modal community-voting-modal" role="dialog" aria-modal="true" aria-labelledby="voting-manage-title">
        <header className="society-form-header">
          <div><span className="society-eyebrow">VOTING MANAGEMENT</span><h2 id="voting-manage-title">{voting.title || 'Voting record'}</h2><p>Manage ballot choices, eligible voters, identity checks, and audit activity.</p></div>
          <button type="button" className="modal-close-btn" aria-label="Close" onClick={onClose} disabled={busy}><X size={18} /></button>
        </header>
        {error && <div className="society-error" role="alert">{error}</div>}
        <div className="society-form-body community-record-body community-voting-content">
          <section className="community-voting-section">
            <div className="community-voting-heading"><div><h3>{isElection ? 'Candidates' : 'Options'}</h3><p>{options.length} {isElection ? 'candidates' : 'options'} · {voting.status || 'DRAFT'}</p></div><button type="button" className="society-icon-action" onClick={load} disabled={loading || busy} aria-label="Refresh voting data"><RefreshCw size={16} /></button></div>
            {loading ? <p>Loading voting details…</p> : options.length ? <div className="community-voting-list">{options.map((option) => <article key={option.id}>
              <div><strong>{option.optionLabel}</strong><small>{option.optionCode}{isElection ? ` · ${option.candidateStatus || 'PENDING'}` : ''}</small></div>
              {isElection && option.candidateStatus === 'PENDING' && <div className="community-voting-actions"><button type="button" className="society-workflow-action" disabled={busy} onClick={() => reviewCandidate(option, true)}><Check size={14} /> Approve</button><button type="button" className="btn-secondary" disabled={busy} onClick={() => reviewCandidate(option, false)}>Reject</button></div>}
            </article>)}</div> : <p>No {isElection ? 'candidates' : 'options'} have been added.</p>}
            {voting.status === 'DRAFT' && <form className="community-voting-form" onSubmit={addOption}>
              <label>Code<input required value={optionForm.optionCode} onChange={(event) => setOptionForm((value) => ({ ...value, optionCode: event.target.value }))} placeholder={isElection ? 'CAND-01' : 'OPTION-01'} /></label>
              <label>{isElection ? 'Candidate name / option' : 'Option label'}<input required value={optionForm.optionLabel} onChange={(event) => setOptionForm((value) => ({ ...value, optionLabel: event.target.value }))} placeholder={isElection ? 'Candidate display label' : 'Choice or resolution option'} /></label>
              {isElection && <label>Active resident account<select required value={optionForm.candidateUserId} onChange={(event) => setOptionForm((value) => ({ ...value, candidateUserId: event.target.value }))}><option value="">Select candidate</option>{accounts.map((account) => <option key={account.id} value={account.id}>{displayName(account)}</option>)}</select></label>}
              <button type="submit" className="btn-primary" disabled={busy}>{isElection ? 'Add candidate' : 'Add option'}</button>
            </form>}
          </section>

          <section className="community-voting-section">
            <div className="community-voting-heading"><div><h3>Eligible voters</h3><p>{eligibleVoters.length} registered · {numberOfEligible(eligibleVoters)} eligible</p></div><Users size={18} /></div>
            {eligibleVoters.length ? <div className="community-voting-list">{eligibleVoters.map((voter) => <article key={voter.id}>
              <div><strong>{voter.displayName || voter.email || voter.userId}</strong><small>{voter.memberType || 'Member'} · {voter.eligibilityStatus || 'ELIGIBLE'}{voter.hasVoted ? ' · Voted' : ''}</small></div>
              {voting.identityVerificationRequired && ['DRAFT', 'SCHEDULED'].includes(voting.status) && <button type="button" className="society-workflow-action" disabled={busy} onClick={() => verifyIdentity(voter, !voter.identityVerified)}>{voter.identityVerified ? 'Unverify identity' : 'Verify identity'}</button>}
            </article>)}</div> : <p>No eligible voters have been registered.</p>}
            {['DRAFT', 'SCHEDULED'].includes(voting.status) && <form className="community-voting-form" onSubmit={addVoter}>
              <label>Active resident account<select required value={voterForm.userId} onChange={(event) => { const account = accounts.find((row) => row.id === event.target.value); setVoterForm({ userId: event.target.value, memberType: account?.memberType || 'OWNER' }); }}><option value="">Select voter</option>{accounts.filter((account) => !eligibleVoters.some((voter) => voter.userId === account.id)).map((account) => <option key={account.id} value={account.id}>{displayName(account)} · {account.memberType}</option>)}</select></label>
              <label>Membership type<select value={voterForm.memberType} onChange={(event) => setVoterForm((value) => ({ ...value, memberType: event.target.value }))}><option value="OWNER">Owner</option><option value="CO_OWNER">Co-owner</option><option value="TENANT">Tenant</option><option value="FAMILY_MEMBER">Family member</option></select></label>
              <button type="submit" className="btn-primary" disabled={busy || !voterForm.userId}><UserPlus size={15} /> Add eligible voter</button>
            </form>}
          </section>

          <section className="community-voting-section">
            <div className="community-voting-heading"><div><h3>Audit history</h3><p>Recorded voting setup and management activity.</p></div></div>
            {audit.length ? <div className="community-voting-list">{audit.slice(0, 8).map((entry) => <article key={entry.id}><div><strong>{String(entry.action || 'Activity').replaceAll('_', ' ')}</strong><small>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Recorded'}</small></div></article>)}</div> : <p>No audit events returned.</p>}
          </section>
        </div>
        <footer className="society-form-footer"><button type="button" className="btn-secondary" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}

function numberOfEligible(voters) {
  return voters.filter((voter) => String(voter.eligibilityStatus || '').toUpperCase() === 'ELIGIBLE').length;
}
