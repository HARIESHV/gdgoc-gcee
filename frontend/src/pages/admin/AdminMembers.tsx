import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, UsersRound } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ButtonSpinner } from '../../components/ui/Spinner';
import { api, getErrorMessage } from '../../lib/api';
import { TEAMS, DEPARTMENTS, YEARS } from '../../lib/utils';
import type { Member } from '../../types';

const COORDINATOR_ROLES = [
  'Lead Coordinator',
  'Technical Coordinator',
  'Event Coordinator',
  'Design Coordinator',
  'Content Coordinator',
  'Social Media Coordinator',
  'Marketing Coordinator',
  'Other Coordinator',
];

const emptyForm = { name: '', team: 'Community Members', role: 'Lead Coordinator', customRole: '', department: '', year: '', photo: '', github: '', linkedin: '', instagram: '', twitter: '' };

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/members');
      setMembers(res.data.members);
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

  const openEdit = (m: Member) => {
    setEditing(m);
    const isStandardRole = COORDINATOR_ROLES.includes(m.role);
    setForm({
      name: m.name,
      team: m.team,
      role: isStandardRole ? m.role : 'Other Coordinator',
      customRole: isStandardRole ? '' : m.role,
      department: m.department,
      year: m.year,
      photo: m.photo,
      github: m.socialLinks?.github || '',
      linkedin: m.socialLinks?.linkedin || '',
      instagram: m.socialLinks?.instagram || '',
      twitter: m.socialLinks?.twitter || '',
    });
    setModal(true);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Name is required.');
      return;
    }

    const finalRole = form.role === 'Other Coordinator' && form.customRole.trim()
      ? form.customRole.trim()
      : form.role;

    setBusy(true);
    const payload = {
      name: form.name,
      team: form.team,
      role: finalRole,
      department: form.department,
      year: form.year,
      photo: form.photo,
      socialLinks: { github: form.github, linkedin: form.linkedin, instagram: form.instagram, twitter: form.twitter },
    };
    try {
      const res = editing
        ? await api.put(`/admin/members/${editing._id}`, payload)
        : await api.post('/admin/members', payload);
      toast.success(res.data.message);
      setModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Remove member "${name}"?`)) return;
    try {
      const res = await api.delete(`/admin/members/${id}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const grouped = TEAMS.map((t) => ({ team: t, members: members.filter((m) => m.team === t) })).filter((g) => g.members.length > 0);

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Team Members & Roles"
        subtitle={`${members.length} team members registered`}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add member
          </button>
        }
      />

      {loading ? (
        <PageLoader label="Loading members…" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="h-7 w-7" />}
          title="No members yet"
          action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add member</button>}
        />
      ) : (
        <div className="space-y-10">
          {grouped.map((g) => (
            <div key={g.team}>
              <h2 className="mb-4 font-display text-base sm:text-lg font-bold text-navy-900">
                {g.team} <span className="text-sm font-normal text-ink-muted">({g.members.length})</span>
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {g.members.map((m) => (
                  <div
                    key={m._id}
                    className="card group flex flex-col justify-between overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lift"
                  >
                    <div>
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 flex items-center justify-center border-b border-navy-50">
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.name}
                            draggable={false}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 pointer-events-none select-none"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-g-blue to-g-green">
                            <span className="font-display text-5xl font-bold text-white/30">{m.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-1">
                        <p className="truncate text-sm font-bold text-navy-900 sm:text-base">{m.name}</p>
                        <span className="inline-block rounded-full bg-g-blue/10 px-2 py-0.5 font-mono text-xs font-bold text-g-blue truncate max-w-full">
                          {m.role || 'Member'}
                        </span>
                        <p className="truncate text-[11px] text-ink-faint">
                          {[m.department, m.year].filter(Boolean).join(' · ') || 'GCEE'}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2.5">
                        <button
                          onClick={() => openEdit(m)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-g-blue/10 hover:text-g-blue transition"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => remove(m._id, m.name)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-g-red/10 hover:text-g-red transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit member' : 'Add member'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name <span className="text-g-red">*</span></label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Student Full Name" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Team / Category</label>
              <select className="input" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}>
                {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Coordinator Role</label>
              <select className="input font-semibold" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {COORDINATOR_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {form.role === 'Other Coordinator' && (
            <div>
              <label className="label">Custom Role Title</label>
              <input
                className="input"
                value={form.customRole}
                onChange={(e) => setForm((f) => ({ ...f, customRole: e.target.value }))}
                placeholder="e.g. Media Lead, Logistics Coordinator"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Year / Class</label>
              <select className="input" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
                <option value="">Select Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">GitHub URL</label>
              <input className="input" value={form.github} onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))} placeholder="https://github.com/username" />
            </div>
            <div>
              <label className="label">LinkedIn URL</label>
              <input className="input" value={form.linkedin} onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/username" />
            </div>
            <div>
              <label className="label">Instagram URL</label>
              <input className="input" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="https://instagram.com/username" />
            </div>
            <div>
              <label className="label">Twitter / X URL</label>
              <input className="input" value={form.twitter} onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))} placeholder="https://x.com/username" />
            </div>
          </div>

          <div>
            <label className="label">Profile Photo</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} className="text-sm text-ink-muted" />
              {form.photo && <img src={form.photo} alt="preview" className="h-20 w-20 rounded-xl object-cover border border-navy-100 p-0.5" />}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <ButtonSpinner /> : null}
              {busy ? 'Saving…' : editing ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
