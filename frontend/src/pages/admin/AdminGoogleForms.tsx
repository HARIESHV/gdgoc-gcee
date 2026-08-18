import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link2, Plus, Trash2, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { api, getErrorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';

interface GoogleFormRow {
  _id: string;
  title: string;
  description: string;
  formUrl: string;
  type: 'registration' | 'participation';
  isActive: boolean;
  createdAt: string;
}

export default function AdminGoogleForms() {
  const [forms, setForms] = useState<GoogleFormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<GoogleFormRow | null>(null);
  const [form, setForm] = useState({ title: '', description: '', formUrl: '', type: 'registration' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/google-forms');
      setForms(res.data.forms);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingForm(null);
    setForm({ title: '', description: '', formUrl: '', type: 'registration' });
    setModalOpen(true);
  };

  const openEdit = (f: GoogleFormRow) => {
    setEditingForm(f);
    setForm({ title: f.title, description: f.description, formUrl: f.formUrl, type: f.type });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.formUrl) {
      toast.error('Title and form URL are required.');
      return;
    }
    setBusy(true);
    try {
      if (editingForm) {
        await api.put(`/admin/google-forms/${editingForm._id}`, form);
        toast.success('Form updated.');
      } else {
        await api.post('/admin/google-forms', form);
        toast.success('Form created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (f: GoogleFormRow) => {
    try {
      await api.put(`/admin/google-forms/${f._id}`, { isActive: !f.isActive });
      toast.success(f.isActive ? 'Form deactivated.' : 'Form activated.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (f: GoogleFormRow) => {
    if (!window.confirm(`Delete "${f.title}"?`)) return;
    try {
      await api.delete(`/admin/google-forms/${f._id}`);
      toast.success('Form deleted.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Forms"
        subtitle="Manage student registration and event participation forms"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Form
          </button>
        }
      />

      {loading ? (
        <PageLoader label="Loading forms…" />
      ) : forms.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-7 w-7" />}
          title="No Google Forms configured"
          description="Add a Google Form link for student registration or event participation."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {forms.map((f) => (
            <div key={f._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy-900">{f.title}</h3>
                    <span className={cn('chip text-xs', f.type === 'registration' ? 'bg-g-blue/10 text-g-blue' : 'bg-g-green/10 text-green-700')}>
                      {f.type}
                    </span>
                  </div>
                  {f.description && <p className="mt-1 text-sm text-ink-muted">{f.description}</p>}
                  <a href={f.formUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-g-blue hover:underline">
                    <ExternalLink className="h-3 w-3" /> {f.formUrl.length > 50 ? f.formUrl.slice(0, 50) + '…' : f.formUrl}
                  </a>
                </div>
                <span className={cn('chip text-xs', f.isActive ? 'bg-g-green/10 text-green-700' : 'bg-slate-100 text-slate-500')}>
                  {f.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(f)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                <button onClick={() => toggleActive(f)} className="btn-outline !py-1.5 !px-3 text-xs">
                  {f.isActive ? <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</> : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>}
                </button>
                <button onClick={() => remove(f)} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingForm ? 'Edit Google Form' : 'Add Google Form'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label" htmlFor="gf-title">Title</label>
            <input id="gf-title" className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Event Registration Form" />
          </div>
          <div>
            <label className="label" htmlFor="gf-desc">Description</label>
            <input id="gf-desc" className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div>
            <label className="label" htmlFor="gf-url">Google Form URL</label>
            <input id="gf-url" className="input font-mono text-sm" value={form.formUrl} onChange={(e) => setForm((f) => ({ ...f, formUrl: e.target.value }))} placeholder="https://docs.google.com/forms/d/..." />
          </div>
          <div>
            <label className="label" htmlFor="gf-type">Type</label>
            <select id="gf-type" className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="registration">Student Registration</option>
              <option value="participation">Event Participation</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : editingForm ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
