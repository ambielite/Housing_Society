import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDate, formatDateTime, formatMoney } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import DataTable from '../../../components/tables/DataTable';
import AmenityTabs from '../components/AmenityTabs';
import AmenityForm from '../components/AmenityForm';
import PricingRuleForm from '../components/PricingRuleForm';
import BlockoutForm from '../components/BlockoutForm';
import SlotForm from '../components/SlotForm';
import { AmenityStatusBadge, SlotStatusBadge } from '../components/AmenityBadges';
import { AMENITY_TYPES, labelOf } from '../components/amenityOptions';
import * as api from '../api/amenities.api';

export default function AmenityDetailPage() {
  const { amenityId } = useParams();
  const { hasPermission } = useAuth();
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const amenity = useFetch(() => api.getAmenity(amenityId), [amenityId]);
  const rules = useFetch(() => (hasPermission('AMENITY_PRICING_RULE_READ') ? api.listPricingRules(amenityId) : Promise.resolve(null)), [amenityId, hasPermission('AMENITY_PRICING_RULE_READ')]);
  const blockouts = useFetch(() => (hasPermission('AMENITY_BLOCKOUT_READ') ? api.listBlockouts(amenityId) : Promise.resolve(null)), [amenityId, hasPermission('AMENITY_BLOCKOUT_READ')]);
  const slots = useFetch(() => (hasPermission('AMENITY_SLOT_READ') ? api.listSlots({ amenityId }) : Promise.resolve(null)), [amenityId, hasPermission('AMENITY_SLOT_READ')]);

  const open = (next) => { setError(''); setNotice(''); setDialog(next); };

  const save = async (payload) => {
    setSaving(true); setError('');
    try {
      switch (dialog.type) {
        case 'amenity':
          await api.updateAmenity(amenityId, payload);
          amenity.reload();
          setNotice('Amenity updated.');
          break;
        case 'slot':
          await api.createSlot(payload);
          slots.reload();
          setNotice('Slot created.');
          break;
        case 'rule':
          await api.createPricingRule(payload);
          rules.reload();
          setNotice('Pricing rule created.');
          break;
        case 'rule-edit':
          await api.updatePricingRule(dialog.rule.id, payload);
          rules.reload();
          setNotice('Pricing rule updated.');
          break;
        case 'blockout':
          await api.createBlockout(payload);
          blockouts.reload();
          setNotice('Blockout created.');
          break;
        default:
          break;
      }
      setDialog(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setError('');
    try {
      if (deleteTarget.type === 'rule') {
        await api.deletePricingRule(deleteTarget.item.id);
        rules.reload();
        setNotice('Pricing rule deleted.');
      } else {
        await api.deleteBlockout(deleteTarget.item.id);
        blockouts.reload();
        setNotice('Blockout removed.');
      }
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); setDeleteTarget(null); }
  };

  if (amenity.error) return <PageContainer title="Amenity"><AmenityTabs /><Alert>{getErrorMessage(amenity.error)}</Alert></PageContainer>;
  if (!amenity.data) return <PageContainer title="Amenity"><AmenityTabs /><div className="table-state">Loading...</div></PageContainer>;

  const a = amenity.data;
  const slotOptions = [{ value: a.id, label: a.name }];

  return (
    <PageContainer title={a.name} subtitle="Amenity configuration, slots, pricing rules and maintenance windows.">
      <AmenityTabs />
      <div className="back-link"><Link to="/amenities/list">← Back to amenities</Link></div>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-head">
            <div><h2 className="section-title">Amenity details</h2><p className="muted">Master configuration.</p></div>
            {hasPermission('AMENITY_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => open({ type: 'amenity' })}>Edit</button>}
          </div>
          <dl className="details">
            <dt>Name</dt><dd>{a.name}</dd>
            <dt>Type</dt><dd>{labelOf(AMENITY_TYPES, a.amenity_type)}</dd>
            <dt>Capacity</dt><dd>{a.capacity ?? '-'}</dd>
            <dt>Location</dt><dd>{a.location || '-'}</dd>
            <dt>Booking required</dt><dd>{a.booking_required ? 'Yes' : 'No'}</dd>
            <dt>Status</dt><dd><AmenityStatusBadge status={a.status} /></dd>
          </dl>
        </section>

        {hasPermission('AMENITY_SLOT_READ') && (
          <section className="card">
            <div className="section-head">
              <div><h2 className="section-title">Slots</h2><p className="muted">Bookable time windows for this amenity.</p></div>
              {hasPermission('AMENITY_SLOT_CREATE') && <button className="btn btn-primary btn-sm" onClick={() => open({ type: 'slot' })}>Add slot</button>}
            </div>
            <DataTable
              columns={[
                { key: 'date', header: 'Date', render: (s) => formatDate(s.slot_date) },
                { key: 'time', header: 'Time', render: (s) => `${String(s.start_time).slice(0, 5)} - ${String(s.end_time).slice(0, 5)}` },
                { key: 'capacity', header: 'Capacity', render: (s) => s.capacity },
                { key: 'price', header: 'Price', render: (s) => formatMoney(s.price) },
                { key: 'status', header: 'Status', render: (s) => <SlotStatusBadge status={s.status} /> },
              ]}
              rows={slots.data}
              loading={slots.loading}
              error={slots.error ? getErrorMessage(slots.error) : ''}
              onRetry={slots.reload}
              emptyTitle="No slots yet"
              emptyMessage="Add a time slot to make this amenity bookable."
            />
          </section>
        )}
      </div>

      {hasPermission('AMENITY_PRICING_RULE_READ') && (
        <section className="card section">
          <div className="section-head">
            <div><h2 className="section-title">Dynamic pricing</h2><p className="muted">Prices can vary by member type and day type.</p></div>
            {hasPermission('AMENITY_PRICING_RULE_CREATE') && <button className="btn btn-primary btn-sm" onClick={() => open({ type: 'rule' })}>Add pricing rule</button>}
          </div>
          <DataTable
            columns={[
              { key: 'member', header: 'Member', render: (r) => r.member_type },
              { key: 'day', header: 'Day type', render: (r) => r.day_type },
              { key: 'price', header: 'Price', render: (r) => formatMoney(r.price) },
              { key: 'from', header: 'From', render: (r) => formatDate(r.effective_from) },
              { key: 'to', header: 'To', render: (r) => formatDate(r.effective_to) },
              { key: 'actions', header: '', render: (r) => <div className="row-actions">
                {hasPermission('AMENITY_PRICING_RULE_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => open({ type: 'rule-edit', rule: r })}>Edit</button>}
                {hasPermission('AMENITY_PRICING_RULE_DELETE') && <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget({ type: 'rule', item: r })}>Delete</button>}
              </div> },
            ]}
            rows={rules.data}
            loading={rules.loading}
            error={rules.error ? getErrorMessage(rules.error) : ''}
            onRetry={rules.reload}
            emptyTitle="No pricing rules"
            emptyMessage="The slot's default price will be used when no matching rule exists."
          />
        </section>
      )}

      {hasPermission('AMENITY_BLOCKOUT_READ') && (
        <section className="card section">
          <div className="section-head">
            <div><h2 className="section-title">Blockouts</h2><p className="muted">Maintenance or event windows during which slots cannot be created or booked.</p></div>
            {hasPermission('AMENITY_BLOCKOUT_CREATE') && <button className="btn btn-primary btn-sm" onClick={() => open({ type: 'blockout' })}>Add blockout</button>}
          </div>
          <DataTable
            columns={[
              { key: 'start', header: 'Starts', render: (b) => formatDateTime(b.start_at) },
              { key: 'end', header: 'Ends', render: (b) => formatDateTime(b.end_at) },
              { key: 'reason', header: 'Reason', render: (b) => b.reason || '-' },
              { key: 'actions', header: '', render: (b) => hasPermission('AMENITY_BLOCKOUT_DELETE') ? <div className="row-actions"><button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget({ type: 'blockout', item: b })}>Remove</button></div> : null },
            ]}
            rows={blockouts.data}
            loading={blockouts.loading}
            error={blockouts.error ? getErrorMessage(blockouts.error) : ''}
            onRetry={blockouts.reload}
            emptyTitle="No blockouts"
            emptyMessage="Create a blockout when maintenance or an event should prevent bookings."
          />
        </section>
      )}

      {dialog && (
        <Modal title={{ amenity: 'Edit amenity', slot: 'Add slot', rule: 'Add pricing rule', 'rule-edit': 'Edit pricing rule', blockout: 'Add blockout' }[dialog.type]} onClose={() => !saving && setDialog(null)} busy={saving}>
          {dialog.type === 'amenity' && <AmenityForm amenity={a} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />}
          {dialog.type === 'slot' && <SlotForm amenityOptions={slotOptions} defaultAmenityId={a.id} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />}
          {dialog.type === 'rule' && <PricingRuleForm amenityId={a.id} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />}
          {dialog.type === 'rule-edit' && <PricingRuleForm rule={dialog.rule} amenityId={a.id} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />}
          {dialog.type === 'blockout' && <BlockoutForm amenityId={a.id} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'rule' ? 'Delete pricing rule?' : 'Remove blockout?'}
        message={deleteTarget?.type === 'rule' ? 'This pricing rule will no longer be available for future booking price resolution.' : 'The blockout will be removed and future slot creation in that window will be allowed.'}
        confirmLabel={deleteTarget?.type === 'rule' ? 'Delete rule' : 'Remove blockout'}
        danger
        busy={saving}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
