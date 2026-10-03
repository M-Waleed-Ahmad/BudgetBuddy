import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../../utils/format';
import { categoryName } from './planStats';

const STATUS_LABELS = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' };

function statusTitle(expense) {
  if (expense.status === 'approved' && expense.approved_by?.name) return `Approved by ${expense.approved_by.name}`;
  if (expense.status === 'rejected' && expense.approved_by?.name) return `Rejected by ${expense.approved_by.name}`;
  return undefined;
}

/** Table of family expenses with role-aware row actions. */
export default function ExpensesTable({ expenses, currency, permissions, reviewingId, onEdit, onDelete, onReview }) {
  return (
    <div className="family-table-wrap">
      <table className="family-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Added by</th>
            <th scope="col" className="family-table__num">
              Amount
            </th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="family-visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const canEdit = permissions.canEditExpense(expense);
            const canReview = permissions.canReviewExpense(expense);
            const busy = reviewingId === expense._id;
            const label = expense.description || 'expense';
            return (
              <tr key={expense._id}>
                <td>{formatDate(expense.expense_date)}</td>
                <td className="family-table__wrap">
                  {expense.description || '—'}
                  {expense.notes && <span className="family-table__note">{expense.notes}</span>}
                </td>
                <td className={expense.category ? undefined : 'family-muted'}>{categoryName(expense)}</td>
                <td>{expense.added_by?.name || 'Former member'}</td>
                <td className="family-table__num">{formatCurrency(expense.amount, currency)}</td>
                <td>
                  <span className={`family-status-badge family-status-badge--${expense.status}`} title={statusTitle(expense)}>
                    {STATUS_LABELS[expense.status] || expense.status}
                  </span>
                </td>
                <td>
                  <div className="family-row-actions">
                    {canReview && (
                      <>
                        <button
                          type="button"
                          className="family-icon-btn family-icon-btn--success"
                          onClick={() => onReview(expense, 'approve')}
                          disabled={busy}
                          aria-label={`Approve ${label}`}
                          title="Approve"
                        >
                          <FiCheck aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="family-icon-btn family-icon-btn--danger"
                          onClick={() => onReview(expense, 'reject')}
                          disabled={busy}
                          aria-label={`Reject ${label}`}
                          title="Reject"
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      </>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className="family-icon-btn"
                          onClick={() => onEdit(expense)}
                          disabled={busy}
                          aria-label={`Edit ${label}`}
                          title="Edit"
                        >
                          <FiEdit2 aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="family-icon-btn family-icon-btn--danger"
                          onClick={() => onDelete(expense)}
                          disabled={busy}
                          aria-label={`Delete ${label}`}
                          title="Delete"
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
