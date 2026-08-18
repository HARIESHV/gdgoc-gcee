import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { api, getErrorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';

interface ContactMsg {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMsg, setViewMsg] = useState<ContactMsg | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contact-messages');
      setMessages(res.data.messages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (msg: ContactMsg) => {
    if (!msg.isRead) {
      try {
        await api.patch(`/admin/contact-messages/${msg._id}/read`);
        setMessages((m) => m.map((x) => x._id === msg._id ? { ...x, isRead: true } : x));
      } catch {}
    }
    setViewMsg(msg);
  };

  const remove = async (msg: ContactMsg) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/admin/contact-messages/${msg._id}`);
      toast.success('Message deleted.');
      setMessages((m) => m.filter((x) => x._id !== msg._id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Messages"
        subtitle={`${messages.length} message${messages.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
      />

      {loading ? (
        <PageLoader label="Loading messages…" />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-7 w-7" />}
          title="No messages yet"
          description="Contact form submissions from students will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">From</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Message</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {messages.map((m) => (
                <tr key={m._id} className={cn('transition hover:bg-navy-50/50', !m.isRead && 'bg-g-blue/5')}>
                  <td className="p-4">
                    <p className={cn('font-semibold text-navy-900', !m.isRead && 'font-bold')}>{m.name}</p>
                    <p className="text-xs text-ink-muted">{m.email}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{m.subject || 'General Inquiry'}</td>
                  <td className="p-4 max-w-[200px] truncate text-ink-muted">{m.message}</td>
                  <td className="p-4 text-ink-faint">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => markRead(m)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-blue/10 hover:text-g-blue" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(m)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewMsg} onClose={() => setViewMsg(null)} title="Message">
        {viewMsg && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-navy-900">{viewMsg.name}</p>
              <p className="text-sm text-ink-muted">{viewMsg.email}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {viewMsg.createdAt ? new Date(viewMsg.createdAt).toLocaleString('en-IN') : ''}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Subject</p>
              <p className="text-sm text-navy-900">{viewMsg.subject || 'General Inquiry'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Message</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{viewMsg.message}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
