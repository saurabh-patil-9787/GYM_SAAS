import React, { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Pencil, Trash2, X, Eye, EyeOff, Phone, Calendar, TrendingUp, ShieldCheck, ShieldOff, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const maskMobile = m => m ? `${m.slice(0, 5)} *****` : '—';
const initials = name => name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

const TONE_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
];
const getTone = idx => TONE_COLORS[idx % TONE_COLORS.length];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-28 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-md transition-all
      ${type === 'error' ? 'bg-red-600/95 text-white' : 'bg-emerald-600/95 text-white'}`}>
      {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {msg}
    </div>
  );
}

// ── Staff Form Modal ──────────────────────────────────────────────────────────
function StaffModal({ staff, onClose, onSaved }) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    name: staff?.name || '',
    mobile: staff?.mobile || '',
    password: '',
    canViewRevenue: staff?.canViewRevenue ?? true,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) return setError('Enter a valid 10-digit mobile number');
    if (!isEdit && form.password.length < 8) return setError('Password must be at least 8 characters');
    if (isEdit && form.password && form.password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        canViewRevenue: form.canViewRevenue,
      };
      if (form.password) payload.password = form.password;
      if (isEdit) {
        await api.put(`/api/staff/${staff._id}`, payload);
      } else {
        await api.post('/api/staff', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-200">{isEdit ? 'Edit Staff' : 'New Staff'}</p>
            <h2 className="text-lg font-black text-white mt-0.5">{isEdit ? 'Update details' : 'Add support member'}</h2>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition overflow-hidden">
              <span className="pl-4 pr-2 text-sm font-semibold text-slate-400">+91</span>
              <input
                type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="flex-1 bg-transparent py-3 pr-4 text-sm font-medium text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password {isEdit && <span className="text-slate-400 normal-case font-normal">(leave blank to keep current)</span>}
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition overflow-hidden">
              <input
                type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Min 8 characters"
                className="flex-1 bg-transparent py-3 pl-4 text-sm font-medium text-slate-800 outline-none"
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="px-4 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Revenue Toggle */}
          <div className={`flex items-center justify-between rounded-2xl border-2 p-4 transition cursor-pointer
            ${form.canViewRevenue ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
            onClick={() => set('canViewRevenue', !form.canViewRevenue)}>
            <div className="flex items-center gap-3">
              {form.canViewRevenue
                ? <ShieldCheck size={20} className="text-emerald-600" />
                : <ShieldOff size={20} className="text-slate-400" />}
              <div>
                <p className="text-sm font-bold text-slate-800">Revenue Access</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {form.canViewRevenue ? 'Staff can view Revenue page' : 'Revenue page is hidden for this staff'}
                </p>
              </div>
            </div>
            {/* Toggle Switch */}
            <div className={`relative h-6 w-11 rounded-full transition-colors ${form.canViewRevenue ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.canViewRevenue ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60">
            {loading ? <Loader2 size={17} className="animate-spin" /> : null}
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ staff, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/api/staff/${staff._id}`);
      onDeleted();
    } catch {
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
          <Trash2 size={24} className="text-red-600" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Remove Staff?</h3>
        <p className="mt-1 text-sm text-slate-500">
          <span className="font-bold">{staff.name}</span>'s account will be permanently deleted. They will no longer be able to log in.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 transition disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? 'Removing...' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────
function StaffCard({ staff, index, onEdit, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getTone(index)} text-white text-sm font-black shadow-md`}>
            {initials(staff.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-800">{staff.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone size={11} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-medium">{maskMobile(staff.mobile)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={() => onEdit(staff)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(staff)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex items-center justify-between">
        {/* Revenue badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold
          ${staff.canViewRevenue ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {staff.canViewRevenue ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
          Revenue {staff.canViewRevenue ? 'visible' : 'hidden'}
        </span>
        {/* Added date */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={11} />
          <span>{fmtDate(staff.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100">
        <Users size={38} className="text-indigo-500" />
      </div>
      <h3 className="text-xl font-black text-slate-800">No support staff yet</h3>
      <p className="mt-2 max-w-xs text-sm text-slate-500 leading-relaxed">
        Add trainers or app managers who can help you run your gym. Each gets their own login.
      </p>
      <button onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:opacity-90 active:scale-[0.98] transition">
        <Plus size={17} />
        Add Support Staff
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SupportStaffPage() {
  const { user } = useAuth();

  // Only owners can manage staff
  if (user?.role === 'staff') {
    return <Navigate to="/dashboard/home" replace />;
  }

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | staffObj (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/api/staff');
      setStaffList(res.data);
    } catch {
      showToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleSaved = () => {
    setModal(null);
    showToast(modal === 'add' ? 'Staff account created!' : 'Staff updated!');
    fetchStaff();
  };

  const handleDeleted = () => {
    setDeleteTarget(null);
    showToast('Staff member removed');
    fetchStaff();
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-500">Management</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Support Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Trainers and app managers for your gym</p>
        </div>
        {staffList.length > 0 && (
          <button onClick={() => setModal('add')}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:opacity-90 active:scale-[0.98] transition">
            <Plus size={16} />
            Add Staff
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState onAdd={() => setModal('add')} />
      ) : (
        <>
          {/* Count banner */}
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
            <UserCog size={16} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">{staffList.length} staff member{staffList.length !== 1 ? 's' : ''} — all can perform full member operations</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {staffList.map((s, i) => (
              <StaffCard
                key={s._id} staff={s} index={i}
                onEdit={s => setModal(s)}
                onDelete={s => setDeleteTarget(s)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {modal && (
        <StaffModal
          staff={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          staff={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
