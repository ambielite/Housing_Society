import { useState } from 'react';
import Alert from '../../../components/ui/Alert';
import { getErrorMessage } from '../../../lib/axios';
import { humanize } from '../../../utils/format';
import * as rbacApi from '../api/rbac.api';

const groupByModule = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.module)) map.set(row.module, []);
    map.get(row.module).push(row);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
};

/**
 * canEdit + catalog  -> full checklist; each tick saves straight away.
 * otherwise          -> read-only list of what the role currently grants.
 * `granted` is the role's current permission rows; onGrantedChange gets the fresh list after each save.
 */
export default function RolePermissionsEditor({ roleId, catalog, granted, canEdit, onGrantedChange }) {
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(() => new Set());
  const [error, setError] = useState('');

  const grantedCodes = new Set(granted.map((p) => p.code));
  const term = search.trim().toLowerCase();
  const matches = (p) =>
    !term || `${p.name} ${p.code} ${p.description || ''}`.toLowerCase().includes(term);

  const toggle = async (permission, checked) => {
    setError('');
    setPending((prev) => new Set(prev).add(permission.code));
    try {
      const updated = checked
        ? await rbacApi.assignPermission(roleId, permission.code)
        : await rbacApi.removePermission(roleId, permission.code);
      onGrantedChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(permission.code);
        return next;
      });
    }
  };

  // ---------- read-only ----------
  if (!canEdit || !catalog) {
    const groups = groupByModule(granted);
    if (groups.length === 0) return <p className="muted">This role has no permissions yet.</p>;
    return (
      <div className="perm-readonly">
        {groups.map(([module, rows]) => (
          <div key={module} className="perm-readonly-group">
            <h3>{humanize(module)}</h3>
            <span className="chips">
              {rows.map((p) => (
                <span key={p.code} className="chip" title={p.code}>
                  {p.name}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ---------- editable ----------
  const groups = groupByModule(catalog.filter(matches));

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      <div className="perm-toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search permissions"
          aria-label="Search permissions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="muted">
          {grantedCodes.size} of {catalog.length} granted
        </span>
      </div>

      {groups.length === 0 && <p className="muted">No permissions match "{search}".</p>}

      {groups.map(([module, rows]) => {
        const count = rows.filter((p) => grantedCodes.has(p.code)).length;
        return (
          <details key={module} className="perm-group" open={term ? true : undefined}>
            <summary>
              <span>{humanize(module)}</span>
              <span className="muted">
                {count} / {rows.length}
              </span>
            </summary>
            <div className="perm-list">
              {rows.map((p) => (
                <label key={p.code} className={`perm-item${pending.has(p.code) ? ' is-pending' : ''}`}>
                  <input
                    type="checkbox"
                    checked={grantedCodes.has(p.code)}
                    disabled={pending.has(p.code)}
                    onChange={(event) => toggle(p, event.target.checked)}
                  />
                  <span>
                    <span className="perm-name">{p.name}</span>
                    <span className="perm-code">{p.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
