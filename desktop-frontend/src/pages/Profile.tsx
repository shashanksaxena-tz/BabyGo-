import { useState, useEffect, useRef } from 'react';
import TopBar from '../components/TopBar';
import {
    ChevronRight, Edit2, LogOut, Bell, Shield, HelpCircle,
    Activity, FileText, UserPlus, Zap, Loader2, X, Save,
    Trash2, AlertTriangle, Calendar, User, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChild } from '../contexts/ChildContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

// Region options matching backend enum
const REGIONS = [
    { value: 'searo', label: 'South-East Asia (India, etc.)' },
    { value: 'amro', label: 'Americas (US, Canada, etc.)' },
    { value: 'euro', label: 'Europe' },
    { value: 'afro', label: 'Africa' },
    { value: 'emro', label: 'Eastern Mediterranean' },
    { value: 'wpro', label: 'Western Pacific' },
];

// Gender options
const GENDERS = [
    { value: 'male', label: 'Boy' },
    { value: 'female', label: 'Girl' },
    { value: 'other', label: 'Other' },
];

// Common interest suggestions
const INTEREST_SUGGESTIONS = [
    'Animals', 'Music', 'Art', 'Sports', 'Reading', 'Dancing',
    'Cooking', 'Nature', 'Science', 'Building', 'Puzzles', 'Cars',
    'Dinosaurs', 'Space', 'Dolls', 'Trains', 'Swimming', 'Drawing',
];

interface EditChildForm {
    name: string;
    dateOfBirth: string;
    gender: string;
    region: string;
    interests: string[];
    weight: number;
    height: number;
}

interface EditParentForm {
    name: string;
    email: string;
}

export default function Profile() {
    const { user, logout } = useAuth();
    const { activeChild, children: kids, setActiveChildId, refreshChildren } = useChild();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ devScore: 0, milestones: 0, stories: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // Modal states
    const [editChildModal, setEditChildModal] = useState(false);
    const [editParentModal, setEditParentModal] = useState(false);
    const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
    const [deleteChildConfirm, setDeleteChildConfirm] = useState<string | null>(null);

    // Form states
    const [childForm, setChildForm] = useState<EditChildForm>({
        name: '', dateOfBirth: '', gender: '', region: 'searo', interests: [], weight: 0, height: 0,
    });
    const [parentForm, setParentForm] = useState<EditParentForm>({ name: '', email: '' });
    const [savingChild, setSavingChild] = useState(false);
    const [savingParent, setSavingParent] = useState(false);
    const [deletingChild, setDeletingChild] = useState(false);
    const [newInterest, setNewInterest] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChild?._id) return;

        // Reset file input so the same file can be re-selected
        e.target.value = '';

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('bucket', 'profiles');

            const uploadRes = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const photoUrl = uploadRes.data.url;

            await api.put(`/children/${activeChild._id}`, {
                profilePhotoUrl: photoUrl,
            });

            toast.success('Profile photo updated!');
            await refreshChildren();
        } catch (error: any) {
            console.error('Failed to upload photo:', error);
            toast.error(error.response?.data?.error || 'Failed to upload photo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    useEffect(() => {
        if (!activeChild?._id) {
            setLoadingStats(false);
            return;
        }
        fetchStats();
    }, [activeChild?._id]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const [analysisRes, milestonesRes, storiesRes] = await Promise.allSettled([
                api.get(`/analysis/${activeChild!._id}`),
                api.get(`/children/${activeChild!._id}/milestones`),
                api.get(`/stories/${activeChild!._id}`),
            ]);

            const analyses = analysisRes.status === 'fulfilled'
                ? (analysisRes.value.data.analyses || []) : [];
            const latestScore = analyses[0]?.overallScore || analyses[0]?.results?.scores?.overall || 0;

            const achievedCount = milestonesRes.status === 'fulfilled'
                ? (milestonesRes.value.data.achievedMilestones || []).length : 0;

            const storiesCount = storiesRes.status === 'fulfilled'
                ? (storiesRes.value.data.stories || []).length : 0;

            setStats({ devScore: latestScore, milestones: achievedCount, stories: storiesCount });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const formatAge = (dob: string | undefined) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years > 0) return `${years} Years, ${remainingMonths} Months`;
        return `${months} Months`;
    };

    const formatDateForInput = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    // ---- Handlers ----

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const openEditChildModal = () => {
        if (!activeChild) {
            toast.info('No child profile selected.');
            return;
        }
        setChildForm({
            name: activeChild.name || '',
            dateOfBirth: formatDateForInput(activeChild.dateOfBirth),
            gender: activeChild.gender || 'male',
            region: (activeChild as any).region || 'searo',
            interests: (activeChild as any).interests || [],
            weight: activeChild.weight || 0,
            height: activeChild.height || 0,
        });
        setNewInterest('');
        setEditChildModal(true);
    };

    const handleSaveChild = async () => {
        if (!activeChild?._id) return;
        if (!childForm.name.trim()) {
            toast.error('Child name is required.');
            return;
        }
        if (!childForm.dateOfBirth) {
            toast.error('Date of birth is required.');
            return;
        }

        setSavingChild(true);
        try {
            await api.put(`/children/${activeChild._id}`, {
                name: childForm.name.trim(),
                dateOfBirth: childForm.dateOfBirth,
                gender: childForm.gender,
                region: childForm.region,
                interests: childForm.interests,
                weight: childForm.weight,
                height: childForm.height,
            });
            toast.success('Child profile updated!');
            setEditChildModal(false);
            await refreshChildren();
        } catch (error: any) {
            console.error('Failed to update child:', error);
            toast.error(error.response?.data?.error || 'Failed to update child profile.');
        } finally {
            setSavingChild(false);
        }
    };

    const handleDeleteChild = async (childId: string) => {
        setDeletingChild(true);
        try {
            await api.delete(`/children/${childId}`);
            toast.success('Child profile deleted.');
            setDeleteChildConfirm(null);
            await refreshChildren();
        } catch (error: any) {
            console.error('Failed to delete child:', error);
            toast.error(error.response?.data?.error || 'Failed to delete child profile.');
        } finally {
            setDeletingChild(false);
        }
    };

    const openEditParentModal = () => {
        setParentForm({
            name: user?.name || '',
            email: user?.email || '',
        });
        setEditParentModal(true);
    };

    const handleSaveParent = async () => {
        if (!parentForm.name.trim()) {
            toast.error('Name is required.');
            return;
        }
        setSavingParent(true);
        try {
            await api.put('/auth/preferences', {
                name: parentForm.name.trim(),
            });
            toast.success('Profile updated! Changes will be reflected on next login.');
            setEditParentModal(false);
        } catch (error: any) {
            console.error('Failed to update parent profile:', error);
            toast.error(error.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSavingParent(false);
        }
    };

    const handleDeleteAccount = () => {
        // Backend doesn't have a delete account endpoint yet
        toast.info('Account deletion is not yet available. Please contact support.');
        setDeleteAccountConfirm(false);
    };

    const handleSettingsClick = (label: string) => {
        toast.info(`${label} - Coming Soon!`);
    };

    const toggleInterest = (interest: string) => {
        setChildForm(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const addCustomInterest = () => {
        const trimmed = newInterest.trim();
        if (trimmed && !childForm.interests.includes(trimmed)) {
            setChildForm(prev => ({
                ...prev,
                interests: [...prev.interests, trimmed],
            }));
            setNewInterest('');
        }
    };

    return (
        <>
            <TopBar title="Profile & Settings" subtitle="Manage your account and preferences" />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* Left Column (2/3 width) */}
                <div className="xl:w-2/3 flex flex-col gap-6">

                    {/* Profile Card */}
                    <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col items-center justify-center relative overflow-hidden">

                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-500 to-teal-600"></div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto || !activeChild}
                            className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl mb-4 relative z-10 text-emerald-500 font-bold overflow-hidden group cursor-pointer disabled:cursor-default"
                            title="Upload profile photo"
                        >
                            {activeChild?.profilePhotoUrl ? (
                                <img
                                    src={activeChild.profilePhotoUrl}
                                    alt={activeChild.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                    {activeChild?.name?.charAt(0) || 'N'}
                                </div>
                            )}
                            {/* Hover overlay with camera icon */}
                            {!uploadingPhoto && activeChild && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            )}
                            {/* Uploading spinner overlay */}
                            {uploadingPhoto && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </button>

                        <h2 className="text-2xl font-bold font-heading text-gray-900 mb-1">{activeChild?.name || 'No Child Selected'}</h2>
                        <p className="text-sm font-semibold text-gray-500 mb-3">{formatAge(activeChild?.dateOfBirth)}</p>
                        <span className="bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-8">
                            {stats.devScore >= 80 ? 'On Track' : stats.devScore >= 60 ? 'Progressing' : stats.devScore > 0 ? 'Needs Attention' : 'No Analysis Yet'}
                        </span>

                        <div className="w-full grid grid-cols-3 gap-4 text-center divide-x divide-gray-100 max-w-md mx-auto py-2">
                            <div className="flex flex-col gap-1">
                                {loadingStats ? (
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                                ) : (
                                    <span className="text-3xl font-bold font-heading text-gray-900">{stats.devScore || '\u2014'}</span>
                                )}
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dev Score</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                {loadingStats ? (
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                                ) : (
                                    <span className="text-3xl font-bold font-heading text-gray-900">{stats.milestones}</span>
                                )}
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Milestones</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                {loadingStats ? (
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                                ) : (
                                    <span className="text-3xl font-bold font-heading text-gray-900">{stats.stories}</span>
                                )}
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Stories</span>
                            </div>
                        </div>

                        {/* Children List */}
                        <div className="w-full max-w-md mx-auto mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left mb-2">Switch Profile</h3>
                            {kids.map((child: any) => (
                                <div
                                    key={child._id}
                                    className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${activeChild?._id === child._id ? 'bg-emerald-50 border border-emerald-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <button
                                        onClick={() => setActiveChildId(child._id)}
                                        className="flex items-center gap-4 flex-1 text-left"
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${activeChild?._id === child._id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {child.profilePhotoUrl ? (
                                                <img src={child.profilePhotoUrl} alt={child.name} className="w-full h-full object-cover" />
                                            ) : (
                                                child.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className={`font-bold ${activeChild?._id === child._id ? 'text-emerald-700' : 'text-gray-800'}`}>{child.name}</span>
                                            <span className="text-xs font-medium text-gray-500">{formatAge(child.dateOfBirth)}</span>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {activeChild?._id === child._id && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteChildConfirm(child._id);
                                            }}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                                            title="Delete child profile"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Parent Account */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parent Account</h3>
                        <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-lg font-bold text-purple-600">
                                    {user?.name?.charAt(0) || 'P'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-gray-900">{user?.name}</span>
                                    <span className="text-xs font-medium text-gray-500">{user?.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={openEditParentModal}
                                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Column (1/3 width) */}
                <div className="xl:w-1/3 flex flex-col gap-6">

                    {/* Child Info */}
                    <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col overflow-hidden">
                        <div className="p-5 pb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Child Info</h3>
                        </div>
                        <div className="flex flex-col">
                            <button onClick={openEditChildModal} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition border-t border-gray-50 first:border-none group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Edit2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Edit Profile</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition" />
                            </button>
                            <button onClick={() => navigate('/growth')} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition border-t border-gray-50 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Growth Measurements</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition" />
                            </button>
                            <button onClick={() => handleSettingsClick('Medical Records')} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition border-t border-gray-50 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Medical Records</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition" />
                            </button>
                            <button onClick={() => navigate('/create-child')} className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition border-t border-gray-50 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">Add Another Child</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition" />
                            </button>
                        </div>
                    </div>

                    {/* App Settings */}
                    <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col overflow-hidden">
                        <div className="p-5 pb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">App Settings</h3>
                        </div>
                        <div className="flex flex-col">
                            {[
                                { icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
                                { icon: <Shield className="w-4 h-4" />, label: 'Privacy & Data' },
                                { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support' },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSettingsClick(item.label)}
                                    className="flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition border-t border-gray-50 first:border-none group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subscription</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-gray-900">Free Plan</span>
                                <span className="text-xs font-medium text-gray-500">Basic features</span>
                            </div>
                            <button
                                onClick={() => toast.info('Premium plans coming soon!')}
                                className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_2px_8px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 transition duration-200"
                            >
                                <Zap className="w-3.5 h-3.5 fill-white" /> Upgrade to Premium
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-red-50 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">Danger Zone</h3>
                        <div className="flex items-center gap-4">
                            <button onClick={handleLogout} className="flex-1 flex justify-center items-center gap-2 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 transition">
                                <LogOut className="w-4 h-4" /> Log Out
                            </button>
                            <button
                                onClick={() => setDeleteAccountConfirm(true)}
                                className="flex-1 text-center text-sm font-bold text-gray-400 hover:text-red-500 transition"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* ========== MODALS ========== */}

            {/* Edit Child Modal */}
            {editChildModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditChildModal(false)}>
                    <div className="bg-white rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Child Profile</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Update {activeChild?.name}'s information</p>
                            </div>
                            <button onClick={() => setEditChildModal(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                            {/* Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Child's Name</label>
                                <input
                                    type="text"
                                    value={childForm.name}
                                    onChange={e => setChildForm({ ...childForm, name: e.target.value })}
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 font-medium"
                                    placeholder="Enter name"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" /> Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={childForm.dateOfBirth}
                                    onChange={e => setChildForm({ ...childForm, dateOfBirth: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 font-medium"
                                />
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Gender</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {GENDERS.map(g => (
                                        <button
                                            key={g.value}
                                            type="button"
                                            onClick={() => setChildForm({ ...childForm, gender: g.value })}
                                            className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                                childForm.gender === g.value
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-emerald-300'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weight & Height */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={childForm.weight || ''}
                                        onChange={e => setChildForm({ ...childForm, weight: parseFloat(e.target.value) || 0 })}
                                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 font-medium"
                                        placeholder="e.g., 10.5"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Height (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={childForm.height || ''}
                                        onChange={e => setChildForm({ ...childForm, height: parseFloat(e.target.value) || 0 })}
                                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 font-medium"
                                        placeholder="e.g., 75"
                                    />
                                </div>
                            </div>

                            {/* Region */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Geographic Region</label>
                                <select
                                    value={childForm.region}
                                    onChange={e => setChildForm({ ...childForm, region: e.target.value })}
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 appearance-none font-medium"
                                >
                                    {REGIONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Interests */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Interests</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {INTEREST_SUGGESTIONS.map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleInterest(interest)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                childForm.interests.includes(interest)
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                            }`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                                {/* Custom interest input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newInterest}
                                        onChange={e => setNewInterest(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterest(); } }}
                                        placeholder="Add custom interest..."
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomInterest}
                                        disabled={!newInterest.trim()}
                                        className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition disabled:opacity-40"
                                    >
                                        Add
                                    </button>
                                </div>
                                {/* Show selected custom interests not in suggestions */}
                                {childForm.interests.filter(i => !INTEREST_SUGGESTIONS.includes(i)).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {childForm.interests.filter(i => !INTEREST_SUGGESTIONS.includes(i)).map(interest => (
                                            <span
                                                key={interest}
                                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-1"
                                            >
                                                {interest}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleInterest(interest)}
                                                    className="ml-0.5 hover:text-red-200"
                                                >
                                                    x
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-2 border-t border-gray-100 flex items-center gap-3">
                            <button
                                onClick={() => setEditChildModal(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChild}
                                disabled={savingChild}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {savingChild ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Parent Modal */}
            {editParentModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditParentModal(false)}>
                    <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Parent Profile</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Update your account information</p>
                            </div>
                            <button onClick={() => setEditParentModal(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                    <User className="w-4 h-4" /> Name
                                </label>
                                <input
                                    type="text"
                                    value={parentForm.name}
                                    onChange={e => setParentForm({ ...parentForm, name: e.target.value })}
                                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 font-medium"
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={parentForm.email}
                                    disabled
                                    className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400">Email cannot be changed.</p>
                            </div>
                        </div>

                        <div className="p-6 pt-2 border-t border-gray-100 flex items-center gap-3">
                            <button
                                onClick={() => setEditParentModal(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveParent}
                                disabled={savingParent}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {savingParent ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation */}
            {deleteAccountConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteAccountConfirm(false)}>
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Account?</h3>
                            <p className="text-sm text-gray-500">
                                This will permanently delete your account and all associated data including child profiles, analyses, stories, and milestones. This action cannot be undone.
                            </p>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setDeleteAccountConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Child Confirmation */}
            {deleteChildConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteChildConfirm(null)}>
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Child Profile?</h3>
                            <p className="text-sm text-gray-500">
                                This will permanently delete {kids.find(k => k._id === deleteChildConfirm)?.name}'s profile and all associated data including analyses, stories, and milestones.
                            </p>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setDeleteChildConfirm(null)}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteChild(deleteChildConfirm)}
                                    disabled={deletingChild}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {deletingChild ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
