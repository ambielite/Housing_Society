import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import Alert from '../ui/Alert';
import { displayRecordName, RecordDetailsModal } from '../ui/Modal';

/**
 * Generic table with loading / error / empty states and optional pagination.
 *
 * columns:    [{ key, header, render?(row) }]   (render defaults to row[key])
 * rows:       array, or null before the first load
 * pagination: { page, limit, total, totalPages, onPageChange }
 */
export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  error = '',
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyMessage = '',
  emptyAction = null,
  pagination = null,
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  if (error && !rows) {
    return (
      <div className="table-state">
        <Alert>{error}</Alert>
        {onRetry && (
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="table-state">
        <Spinner />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="table-state">
        <h2>{emptyTitle}</h2>
        {emptyMessage && <p className="muted">{emptyMessage}</p>}
        {emptyAction}
      </div>
    );
  }

  const start = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? start + rows.length - 1 : 0;

  return (
    <div className="table-card">
      <div className={`table-wrap${loading ? ' is-loading' : ''}`} aria-busy={loading}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
              {rows.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((col, index) => (
                  <td key={col.key}>
                    {index === 0 && !col.render ? (
                      <button
                        type="button"
                        className="record-details-trigger"
                        onClick={() => setSelectedRecord({ row, column: col })}
                        aria-label={`View details for ${displayRecordName(row, ['name', 'displayName', 'title', col.key])}`}
                      >
                        {row[col.key] ?? 'View record'}
                      </button>
                    ) : col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.total > 0 && (
        <div className="pagination">
          <span className="muted">
            Showing {start}-{end} of {pagination.total}
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      {selectedRecord && (
        <RecordDetailsModal
          title={displayRecordName(selectedRecord.row, ['name', 'displayName', 'title', selectedRecord.column.key])}
          subtitle={`${selectedRecord.column.header} details`}
          icon={FileText}
          record={selectedRecord.row}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
