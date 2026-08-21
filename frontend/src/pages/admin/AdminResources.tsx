import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { api, getErrorMessage } from '../../lib/api';
import { RESOURCE_CATEGORIES } from '../../lib/utils';
import type { ResourceItem } from '../../types';

const emptyForm = { title: '', description: '', url: '', category: 'Web Development', type: 'link', uploadedBy: '' };

export default function AdminResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/resources');
      setResources(res.data.resources);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (r: ResourceItem) => {
    setEditing(r);
    setForm({ title: r.title, description: r.description, url: r.url, category: r.category, type: r.type || 'link', uploadedBy: r.uploadedBy || '' });
    setModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.error('Title and URL are required.');
      return;
    }
    setBusy(true);
    try {
      const res = editing
        ? await api.put(`/admin/resources/${editing._id}`, form)
        : await api.post('/admin/resources', form);
      toast.success(res.data.message);
      setModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Remove resource "${title}"?`)) return;
    try {
      const res = await api.delete(`/admin/resources/${id}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        subtitle={`${resources.length} resources`}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add resource
          </button>
        }
      />

      {loading ? (
        <PageLoader label="Loading resources…" />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="No resources yet"
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add resource
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">URL</th>
                <th className="p-4 font-medium">Uploaded by</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {resources.map((r) => (
                <tr key={r._id} className="transition hover:bg-navy-50/50">
                  <td className="max-w-[260px] p-4">
                    <p className="truncate font-semibold text-navy-900">{r.title}</p>
                    {r.description && <p className="truncate text-xs text-ink-muted">{r.description}</p>}
                  </td>
                  <td className="p-4"><span className="chip bg-g-blue/10 text-blue-700">{r.category}</span></td>
                  <td className="max-w-[200px] p-4">
                    <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-xs text-g-blue hover:underline">
                      {r.url}
                    </a>
                  </td>
                  <td className="p-4 text-ink-soft">{r.uploadedBy || '—'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-blue/10 hover:text-g-blue"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(r._id, r.title)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit resource' : 'Add resource'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-y" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">URL</label>
            <input className="input font-mono" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Uploaded by</label>
              <input className="input" value={form.uploadedBy} onChange={(e) => setForm((f) => ({ ...f, uploadedBy: e.target.value }))} placeholder="GDGoC GCEE" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : editing ? 'Update' : 'Add resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
