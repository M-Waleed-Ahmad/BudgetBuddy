import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { addCategory, deleteCategory, updateCategory } from '../api';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import SectionState from './SectionState';

/**
 * Lists the user's expense categories with add / rename / delete actions.
 * The parent owns the list and is told to reload it after every change.
 */
const CategoryManager = ({ categories, loading, error, onReload, onChanged, headingLevel = 'h2' }) => {
  const Heading = headingLevel;
  const [editing, setEditing] = useState(null); // null = closed, {} = new, category = rename
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const openForm = (category = {}) => {
    setEditing(category);
    setName(category.name || '');
    setFormError('');
  };

  const closeForm = () => {
    if (!isSaving) setEditing(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Please enter a category name.');
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      if (editing?._id) {
        await updateCategory(editing._id, trimmed);
        toast.success('Category renamed.');
      } else {
        await addCategory(trimmed);
        toast.success('Category added.');
      }
      setEditing(null);
      await onChanged?.();
    } catch (err) {
      setFormError(err.message || 'Could not save the category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteCategory(deleting._id);
      toast.success(`"${deleting.name}" deleted.`);
      setDeleting(null);
      await onChanged?.();
    } catch (err) {
      // 409 = the category is still used by a budget or expense; the API explains which.
      setDeleteError(err.message || 'Could not delete the category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="card category-manager" aria-labelledby="category-manager-title">
      <div className="category-manager__header">
        <Heading id="category-manager-title" className="card-title">
          Expense categories
        </Heading>
        <button type="button" className="primary-button small-button" onClick={() => openForm()}>
          <FiPlus aria-hidden="true" /> Add category
        </button>
      </div>

      <SectionState
        loading={loading}
        error={error}
        onRetry={onReload}
        empty={categories.length === 0}
        emptyMessage="No categories yet. Add one (e.g. Groceries or Rent) to start budgeting."
      >
        <ul className="category-manager__list">
          {categories.map((category) => (
            <li key={category._id} className="category-manager__item">
              <span className="category-manager__name">{category.name}</span>
              <span className="category-manager__actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => openForm(category)}
                  aria-label={`Rename ${category.name}`}
                  title="Rename"
                >
                  <FiEdit2 aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => {
                    setDeleteError('');
                    setDeleting(category);
                  }}
                  aria-label={`Delete ${category.name}`}
                  title="Delete"
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </SectionState>

      <Modal isOpen={editing !== null} onClose={closeForm} title={editing?._id ? 'Rename category' : 'Add category'}>
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && (
            <p className="error-message" role="alert">
              {formError}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="category-name">Category name</label>
            <input
              id="category-name"
              type="text"
              className="input-field"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={closeForm} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving…' : editing?._id ? 'Save' : 'Add category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete category"
        message={
          <>
            Delete <strong>{deleting?.name}</strong>? Categories that are used by a budget or expense can&apos;t be
            deleted.
          </>
        }
        confirmLabel="Delete category"
        busy={isDeleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
};

export default CategoryManager;
