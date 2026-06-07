import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    User, Phone, MapPin, Calendar, Weight, Ruler, 
    AlertCircle, RefreshCw, Save, StopCircle, LogOut, Edit3, X, Check, Bell, Camera, Trash2, Target, Clock, Zap, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import ImageCropper from '../../components/ImageCropper';
import { useImageUpload } from '../../hooks/useImageUpload';

// ── Dark Detail Row ────────────────────────────────────────────────────────────
const DetailRow = ({ icon: Icon, label, value, editField, editing, editData, setEditData, editType, selectOptions }) => (
    <div className="flex items-center gap-3 py-3 border-b border-member-border last:border-0">
        <div className="w-8 h-8 rounded-lg bg-member-surface flex items-center justify-center flex-shrink-0">
            <Icon size={14} className="text-member-muted" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-member-muted font-semibold uppercase tracking-wider">{label}</p>
            {editing && editField ? (
                editType === 'select' ? (
                    <select
                        value={editData[editField] || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, [editField]: e.target.value }))}
                        className="text-sm font-semibold text-member-primary bg-member-elevated border border-member-border rounded-lg px-2.5 py-1.5 mt-1.5 w-full focus:outline-none focus:border-member-accent"
                    >
                        <option value="">Select option</option>
                        {selectOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-member-elevated text-member-primary">{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={editField === 'dob' || editField === 'targetDate' ? 'date' : (editField === 'age' || editField === 'weight' || editField === 'height' || editField === 'goalWeight' ? 'number' : (editField === 'preferredWorkoutTime' ? 'time' : 'text'))}
                        value={editData[editField] || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, [editField]: e.target.value }))}
                        className="text-sm font-semibold text-member-primary bg-member-elevated border border-member-border rounded-lg px-2 py-1 mt-0.5 w-full focus:outline-none focus:border-member-accent"
                    />
                )
            ) : (
                <p className="text-sm font-semibold text-member-secondary truncate">{value || '—'}</p>
            )}
        </div>
    </div>
);

// ── Dark Toggle Switch ─────────────────────────────────────────────────────────
const ToggleRow = ({ label, sub, value, onChange, disabled }) => (
    <div className="flex items-center justify-between py-2">
        <div>
            <p className="text-sm font-semibold text-member-primary">{label}</p>
            <p className="text-[10px] text-member-muted">{sub}</p>
        </div>
        <button
            onClick={onChange}
            disabled={disabled}
            className="w-10 h-6 rounded-full transition-colors relative flex-shrink-0"
            style={{ backgroundColor: value ? '#6c5ce7' : '#17171f', border: `1px solid ${value ? 'rgba(108,92,231,0.4)' : 'rgba(255,255,255,0.07)'}` }}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : ''}`} />
        </button>
    </div>
);

const MemberProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    const photoInputRef = useRef(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const {
        showCropModal, cropImageFile, previewUrl: photoPreview,
        finalFile: croppedPhotoFile, handleFileSelect: handlePhotoFileSelect,
        handleCropComplete: handlePhotoCropComplete, closeCropModal: handlePhotoCropCancel,
        resetUpload: resetPhotoUpload
    } = useImageUpload();

    const handlePhotoUpload = async () => {
        if (!croppedPhotoFile) return;
        setPhotoUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('photo', croppedPhotoFile);
            const res = await api.put('/api/member/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile(prev => ({ ...prev, photoUrl: res.data.member.photoUrl }));
            resetPhotoUpload();
            setSuccessMsg('Photo updated!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Photo upload failed');
        } finally { setPhotoUploading(false); }
    };

    const handleRemovePhoto = async () => {
        if (!profile?.photoUrl) return;
        if (!window.confirm('Remove profile photo?')) return;
        setPhotoUploading(true);
        try {
            const formData = new FormData();
            formData.append('removePhoto', 'true');
            await api.put('/api/member/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile(prev => ({ ...prev, photoUrl: null }));
            setSuccessMsg('Photo removed');
            setTimeout(() => setSuccessMsg(''), 2000);
        } catch { setError('Failed to remove photo'); }
        finally { setPhotoUploading(false); }
    };

    const [preferences, setPreferences] = useState({
        renewalReminders: true, paymentAlerts: true, gymAnnouncements: true,
        gymDayReminder: true, waterReminder: true, measurementReminder: true, weeklyGoalCheckin: true
    });
    const [prefSaving, setPrefSaving] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/member/profile');
            setProfile(res.data);
            setEditData({
                name: res.data.name || '', age: res.data.age || '', weight: res.data.weight || '',
                height: res.data.height || '', city: res.data.city || '',
                dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
                gender: res.data.gender || '', activityLevel: res.data.activityLevel || '',
                fitnessGoal: res.data.fitnessGoal || '', goalWeight: res.data.goalWeight || '',
                targetDate: res.data.targetDate ? new Date(res.data.targetDate).toISOString().split('T')[0] : '',
                preferredWorkoutTime: res.data.preferredWorkoutTime || '07:00'
            });
            if (res.data.notificationPreferences) {
                setPreferences({
                    renewalReminders: res.data.notificationPreferences.renewalReminders ?? true,
                    paymentAlerts: res.data.notificationPreferences.paymentAlerts ?? true,
                    gymAnnouncements: res.data.notificationPreferences.gymAnnouncements ?? true,
                    gymDayReminder: res.data.notificationPreferences.gymDayReminder ?? true,
                    waterReminder: res.data.notificationPreferences.waterReminder ?? true,
                    measurementReminder: res.data.notificationPreferences.measurementReminder ?? true,
                    weeklyGoalCheckin: res.data.notificationPreferences.weeklyGoalCheckin ?? true
                });
            }
        } catch (err) { setError('Failed to load profile'); console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const formData = new FormData();
            Object.entries(editData).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
            await api.put('/api/member/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccessMsg('Profile updated successfully');
            setEditing(false);
            await fetchProfile();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors && Array.isArray(serverErrors)) setError(serverErrors.join(', '));
            else setError(err.response?.data?.message || 'Failed to update profile');
        } finally { setSaving(false); }
    };

    const handlePrefToggle = async (key) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPrefs);
        setPrefSaving(true);
        try {
            await api.put('/api/member/notification-preferences', newPrefs);
            setSuccessMsg('Preferences updated');
            setTimeout(() => setSuccessMsg(''), 2000);
        } catch (err) {
            setError('Failed to update preferences');
            setPreferences(preferences);
        } finally { setPrefSaving(false); }
    };

    const handleStopGym = async () => {
        setStopping(true);
        try {
            await api.post('/api/member/stop-gym');
            setSuccessMsg('Gym membership paused. You can rejoin anytime.');
            setShowStopConfirm(false);
            await fetchProfile();
        } catch (err) { setError(err.response?.data?.message || 'Failed to stop gym'); }
        finally { setStopping(false); }
    };

    const handleLogout = async () => { await logout(); navigate('/', { replace: true }); };

    if (loading) return <BicepCurlLoader text="Loading Profile..." fullScreen={false} />;

    if (error && !profile) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle size={40} className="text-member-rose mx-auto mb-3" />
                    <p className="text-member-secondary font-medium">{error}</p>
                    <button onClick={() => { setLoading(true); setError(''); fetchProfile(); }}
                        className="mt-4 text-member-accent font-semibold text-sm hover:opacity-80 flex items-center gap-1 mx-auto">
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    const gymData = profile?.gym || {};
    const isExpired = profile?.expiryDate ? new Date(profile.expiryDate) < new Date() : false;

    return (
        <div className="p-4 pb-28">
            {/* ── Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold text-member-primary">My Profile</h1>
                    <p className="text-xs text-member-muted">Manage your personal details</p>
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-member-accent hover:opacity-80 px-3 py-1.5 rounded-lg bg-member-accent-soft border border-member-accent/20 transition-colors">
                        <Edit3 size={14} /> Edit
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setEditing(false)}
                            className="flex items-center gap-1 text-xs font-semibold text-member-muted px-2 py-1.5 rounded-lg bg-member-surface border border-member-border transition-colors">
                            <X size={14} /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1 text-xs font-semibold text-white bg-member-accent px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save
                        </button>
                    </div>
                )}
            </div>

            {/* ── Success / Error banners */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-member-emerald-soft border border-member-emerald/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                        <Check size={16} className="text-member-emerald" />
                        <p className="text-xs font-semibold text-member-emerald">{successMsg}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-member-rose-soft border border-member-rose/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                        <AlertCircle size={16} className="text-member-rose" />
                        <p className="text-xs font-semibold text-member-rose">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Profile Photo & Details Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="member-card mb-4">
                <div className="flex items-center gap-4 mb-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            onClick={() => (photoPreview || profile?.photoUrl) && setPreviewImage({ url: photoPreview || profile.photoUrl, title: profile.name })}
                            className={`w-16 h-16 rounded-[13px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-member-accent to-purple-600 ${(photoPreview || profile?.photoUrl) ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                        >
                            {(photoPreview || profile?.photoUrl) ? (
                                <img src={photoPreview || profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-2xl">{profile?.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                        </div>
                        <button onClick={() => photoInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-member-accent hover:opacity-90 rounded-full flex items-center justify-center shadow-md transition-all">
                            <Camera size={11} className="text-white" />
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) handlePhotoFileSelect(e.target.files[0]); e.target.value = ''; }} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-member-primary truncate">{profile?.name}</h2>
                        <p className="text-xs text-member-muted">ID: {profile?.memberId} • {gymData.gymName}</p>
                        {croppedPhotoFile && (
                            <div className="flex gap-2 mt-1.5">
                                <button onClick={handlePhotoUpload} disabled={photoUploading}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-white bg-member-accent px-2.5 py-1 rounded-lg disabled:opacity-50">
                                    {photoUploading ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
                                    {photoUploading ? 'Saving...' : 'Save Photo'}
                                </button>
                                <button onClick={resetPhotoUpload} className="text-[11px] text-member-muted px-2 py-1 rounded-lg hover:bg-member-elevated">Cancel</button>
                            </div>
                        )}
                        {!croppedPhotoFile && profile?.photoUrl && (
                            <button onClick={handleRemovePhoto} className="flex items-center gap-1 text-[11px] text-member-rose mt-1.5 hover:opacity-80">
                                <Trash2 size={9} /> Remove photo
                            </button>
                        )}
                    </div>
                </div>

                <DetailRow icon={User} label="Full Name" value={profile?.name} editField="name" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Phone} label="Mobile" value={profile?.mobile} />
                <DetailRow icon={MapPin} label="City" value={profile?.city} editField="city" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Calendar} label="Age" value={profile?.age ? `${profile.age} years` : null} editField="age" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Weight} label="Weight" value={profile?.weight ? `${profile.weight} kg` : null} editField="weight" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Ruler} label="Height" value={profile?.height ? `${profile.height} cm` : null} editField="height" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Calendar} label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} editField="dob" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={User} label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null}
                    editField="gender" editing={editing} editData={editData} setEditData={setEditData} editType="select"
                    selectOptions={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
                <DetailRow icon={User} label="Activity Level" value={profile?.activityLevel ? profile.activityLevel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : null}
                    editField="activityLevel" editing={editing} editData={editData} setEditData={setEditData} editType="select"
                    selectOptions={[
                        { value: 'sedentary', label: 'Sedentary' },
                        { value: 'lightly_active', label: 'Lightly Active' },
                        { value: 'moderately_active', label: 'Moderately Active' },
                        { value: 'very_active', label: 'Very Active' },
                        { value: 'extremely_active', label: 'Extremely Active' }
                    ]} />
                <DetailRow icon={Target} label="Fitness Goal" value={profile?.fitnessGoal ? profile.fitnessGoal.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : null}
                    editField="fitnessGoal" editing={editing} editData={editData} setEditData={setEditData} editType="select"
                    selectOptions={[
                        { value: 'lose_weight', label: 'Lose Weight' },
                        { value: 'gain_muscle', label: 'Gain Muscle' },
                        { value: 'maintain', label: 'Maintain' }
                    ]} />
                <DetailRow icon={Weight} label="Target Goal Weight" value={profile?.goalWeight ? `${profile.goalWeight} kg` : null} editField="goalWeight" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Calendar} label="Target Date" value={profile?.targetDate ? new Date(profile.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} editField="targetDate" editing={editing} editData={editData} setEditData={setEditData} />
                <DetailRow icon={Clock} label="Preferred Workout Time" value={profile?.preferredWorkoutTime || null} editField="preferredWorkoutTime" editing={editing} editData={editData} setEditData={setEditData} />
            </motion.div>

            {/* ── Notification Preferences */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="member-card mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={16} className="text-member-accent" />
                    <h3 className="text-sm font-bold text-member-primary">Notification Preferences</h3>
                </div>
                <div className="space-y-1 divide-y divide-member-border">
                    <ToggleRow label="Renewal Reminders" sub="Get alerts before your plan expires" value={preferences.renewalReminders} onChange={() => handlePrefToggle('renewalReminders')} disabled={prefSaving} />
                    <ToggleRow label="Payment Alerts" sub="Receipts and payment confirmations" value={preferences.paymentAlerts} onChange={() => handlePrefToggle('paymentAlerts')} disabled={prefSaving} />
                    <ToggleRow label="Gym Announcements" sub="Important updates from your gym owner" value={preferences.gymAnnouncements} onChange={() => handlePrefToggle('gymAnnouncements')} disabled={prefSaving} />
                    <ToggleRow label="Gym Days Reminders" sub="Remind me on days I normally workout" value={preferences.gymDayReminder} onChange={() => handlePrefToggle('gymDayReminder')} disabled={prefSaving} />
                    <ToggleRow label="Water Reminders" sub="Keep my daily hydration on track" value={preferences.waterReminder} onChange={() => handlePrefToggle('waterReminder')} disabled={prefSaving} />
                    <ToggleRow label="Body Measurements" sub="Remind me to log body stats weekly" value={preferences.measurementReminder} onChange={() => handlePrefToggle('measurementReminder')} disabled={prefSaving} />
                    <ToggleRow label="Weekly Goal Checkin" sub="Weekly health stats progress roundup" value={preferences.weeklyGoalCheckin} onChange={() => handlePrefToggle('weeklyGoalCheckin')} disabled={prefSaving} />
                </div>
            </motion.div>

            {/* ── Quick Links */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }} className="member-card mb-4">
                <div className="flex items-center gap-2 mb-4 border-b border-member-border pb-2.5">
                    <Target size={16} className="text-member-accent" />
                    <h3 className="text-sm font-bold text-member-primary">Membership & Billing</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/member/plans')}
                        className="py-3 px-2 rounded-xl bg-member-surface border border-member-border hover:border-member-accent/30 hover:bg-member-elevated text-member-secondary text-xs font-black active:scale-[0.97] transition-all flex flex-col items-center gap-1.5">
                        <Zap size={16} className="text-member-accent" />
                        View Gym Plans
                    </button>
                    <button onClick={() => navigate('/member/transactions')}
                        className="py-3 px-2 rounded-xl bg-member-surface border border-member-border hover:border-member-accent/30 hover:bg-member-elevated text-member-secondary text-xs font-black active:scale-[0.97] transition-all flex flex-col items-center gap-1.5">
                        <Star size={16} className="text-purple-400" />
                        Transactions
                    </button>
                </div>
            </motion.div>

            {/* ── Danger Zone */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2 mt-6">
                {profile?.status !== 'Inactive' && (
                    <button
                        onClick={() => setShowStopConfirm(true)}
                        disabled={!isExpired}
                        className={`w-full member-card flex items-center gap-3 group transition-colors text-left ${
                            !isExpired ? 'opacity-50 cursor-not-allowed' : 'hover:border-member-amber/30'
                        }`}
                        title={!isExpired ? 'Only expired accounts can stop gym' : 'Pause your membership'}
                    >
                        <div className="w-9 h-9 rounded-lg bg-member-amber-soft flex items-center justify-center flex-shrink-0">
                            <StopCircle size={16} className="text-member-amber" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-member-primary flex items-center gap-2">
                                Stop Gym {!isExpired && <span className="text-[10px] font-normal text-member-muted">(Only when plan is expired)</span>}
                            </p>
                            <p className="text-[11px] text-member-muted">Pause your membership</p>
                        </div>
                    </button>
                )}

                <button onClick={handleLogout}
                    className="w-full member-card flex items-center gap-3 group hover:border-member-rose/30 transition-colors text-left">
                    <div className="w-9 h-9 rounded-lg bg-member-rose-soft flex items-center justify-center flex-shrink-0">
                        <LogOut size={16} className="text-member-rose" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-member-primary">Log Out</p>
                        <p className="text-[11px] text-member-muted">Sign out of your account</p>
                    </div>
                </button>
            </motion.div>

            {/* ── Stop Gym Confirmation Modal */}
            <AnimatePresence>
                {showStopConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowStopConfirm(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="member-card-hero p-6 max-w-sm w-full shadow-xl"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="text-center mb-5">
                                <div className="w-12 h-12 rounded-full bg-member-amber-soft flex items-center justify-center mx-auto mb-3">
                                    <StopCircle size={24} className="text-member-amber" />
                                </div>
                                <h3 className="text-lg font-bold text-member-primary">Stop Gym?</h3>
                                <p className="text-sm text-member-secondary mt-1">
                                    This will pause your membership. You won't receive renewal reminders and can't initiate payments until you rejoin.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowStopConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-member-border text-sm font-semibold text-member-secondary bg-member-surface hover:bg-member-elevated transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleStopGym} disabled={stopping}
                                    className="flex-1 py-3 rounded-xl bg-member-amber text-[#111118] text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {stopping ? <RefreshCw size={14} className="animate-spin" /> : <StopCircle size={14} />}
                                    Stop Gym
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ImageCropper */}
            {showCropModal && cropImageFile && (
                <ImageCropper imageFile={cropImageFile} onCropComplete={handlePhotoCropComplete} onCancel={handlePhotoCropCancel} aspectRatio={1} />
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
                    <button onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 text-white/85 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-lg font-bold">
                        ✕
                    </button>
                    <img src={previewImage.url} alt={previewImage.title} onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200" />
                    {previewImage.title && (
                        <p className="text-white font-semibold mt-4 text-sm tracking-wide uppercase bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                            {previewImage.title}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberProfile;
