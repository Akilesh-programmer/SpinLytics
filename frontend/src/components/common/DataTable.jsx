import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

/**
 * Reusable data table with pagination
 * @param {Array} columns — [{ key, label, render?, align? }]
 * @param {Array} data — row data
 * @param {Object} pagination — { page, limit, total, totalPages }
 * @param {Function} onPageChange — callback(newPage)
 * @param {string} emptyMessage — message when no data
 */
export default function DataTable({ columns, data, pagination, onPageChange, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div className="data-table-wrapper">
        <div className="table-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <span className="table-pagination-info">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </span>
          <div className="table-pagination-buttons">
            <button
              className="btn btn-icon"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="btn btn-icon"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
