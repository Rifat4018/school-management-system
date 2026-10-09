import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api/client.js';
import Modal from './Modal.jsx';

// Reusable list page: table + search + filters + pagination + create/edit form + delete.
// Each page (Students, Teachers, ...) only describes its columns and form fields.
export default function CrudPage({
  title,
  singular = 'record', // used in the form title: "Add student"
  endpoint,
  columns, // [{ header, render(row) }]
  fields = [], // [{ name, label, type, required, options, createOnly, full }]
  toForm, // row -> form values, for editing
  filters = [], // [{ name, label, options }]
  searchable = false,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  rowActions, // (row, reload) => extra buttons
}) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(''); // what the user is typing
  const [query, setQuery] = useState(''); // debounced value actually sent to the API
  const [filterValues, setFilterValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null); // null = form closed, {} = new, row = edit
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Debounce: wait 400 ms after the last key press before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, ...filterValues };
      if (query) params.search = query;
      const { data } = await api.get(endpoint, { params });
      setRows(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, query, filterValues]);

  useEffect(() => {
    load();
  }, [load]);

  const isEdit = Boolean(editing && editing._id);
  const visibleFields = fields.filter((f) => !(isEdit && f.createOnly));
  const hasActions = canEdit || canDelete || Boolean(rowActions);
  const closeForm = useCallback(() => setEditing(null), []);

  const openNew = () => {
    setForm({});
    setFormError('');
    setEditing({});
  };
  const openEdit = (row) => {
    setForm(toForm ? toForm(row) : row);
    setFormError('');
    setEditing(row);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const body = {};
    visibleFields.forEach(({ name }) => {
      const value = form[name] ?? '';
      if (isEdit) body[name] = value === '' ? null : value; // null clears the field
      else if (value !== '') body[name] = value;
    });
    try {
      if (isEdit) await api.put(`${endpoint}/${editing._id}`, body);
      else await api.post(endpoint, body);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.delete(`${endpoint}/${row._id}`);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const cell = (value) => (value === undefined || value === null || value === '' ? '—' : value);

  return (
    <section>
      <div className="page-head">
        <h1>{title}</h1>
        {canCreate && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + Add new
          </button>
        )}
      </div>

      {(searchable || filters.length > 0) && (
        <div className="toolbar">
          {searchable && (
            <input type="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          )}
          {filters.map((f) => (
            <select
              key={f.name}
              value={filterValues[f.name] || ''}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [f.name]: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {error && <p className="alert">{error}</p>}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
              {hasActions && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  No records found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row._id}>
                  {columns.map((c) => (
                    <td key={c.header}>{cell(c.render(row))}</td>
                  ))}
                  {hasActions && (
                    <td className="actions">
                      {rowActions && rowActions(row, load)}
                      {canEdit && (
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(row)}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(row)}>
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted">
          {pagination.total} record{pagination.total === 1 ? '' : 's'} · page {pagination.page} of {pagination.pages}
        </span>
        <div>
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Prev
          </button>
          <button type="button" className="btn btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      </div>

      {editing && (
        <Modal title={`${isEdit ? 'Edit' : 'Add'} ${singular}`} onClose={closeForm}>
          <form onSubmit={submit}>
            <div className="form-grid">
              {visibleFields.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={form[f.name]}
                  onChange={(value) => setForm((prev) => ({ ...prev, [f.name]: value }))}
                />
              ))}
            </div>
            {formError && <p className="alert">{formError}</p>}
            <div className="modal-foot">
              <button type="button" className="btn" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

// A controlled input: React state is the single source of truth for its value.
function Field({ field, value, onChange }) {
  const common = {
    id: `f-${field.name}`,
    value: value ?? '',
    required: field.required,
    onChange: (e) => onChange(e.target.value),
  };

  let input;
  if (field.type === 'select') {
    input = (
      <select {...common}>
        <option value="">Select…</option>
        {(field.options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'textarea') {
    input = <textarea rows={4} {...common} />;
  } else {
    input = <input type={field.type || 'text'} min={field.min} minLength={field.minLength} {...common} />;
  }

  return (
    <div className={field.full ? 'field full' : 'field'}>
      <label htmlFor={common.id}>
        {field.label}
        {field.required && ' *'}
      </label>
      {input}
    </div>
  );
}
