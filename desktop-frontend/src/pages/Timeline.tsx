import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { useChild } from '../contexts/ChildContext';
import api from '../api';
import {
    Clock,
    Camera,
    Trophy,
    Scale,
    StickyNote,
    Image,
    Plus,
    Trash2,
    Search,
    Loader2,
    Calendar,
    Activity,
    MessageSquare,
    Brain,
    Heart,
    Sparkles,
    X,
    Filter,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface TimelineEntry {
    _id: string;
    childId: string;
    type: 'analysis' | 'milestone' | 'measurement' | 'photo' | 'note';
    title: string;
    description?: string;
    date: string;
    data?: Record<string, any>;
    mediaPath?: string;
    createdAt?: string;
}

type EntryType = 'all' | 'analysis' | 'milestone' | 'measurement' | 'photo' | 'note';

const ENTRY_TYPES: { id: EntryType; label: string; icon: typeof Clock; color: string; bg: string }[] = [
    { id: 'all', label: 'All', icon: Filter, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'analysis', label: 'Analysis', icon: Camera, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'milestone', label: 'Milestone', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'measurement', label: 'Measurement', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'note', label: 'Note', icon: StickyNote, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'photo', label: 'Photo', icon: Image, color: 'text-pink-600', bg: 'bg-pink-50' },
];

function getEntryStyle(type: string, domain?: string) {
    switch (type) {
        case 'analysis':
            return { icon: Camera, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
        case 'milestone': {
            switch (domain) {
                case 'motor': return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
                case 'language': return { icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200' };
                case 'cognitive': return { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
                case 'social': return { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' };
                case 'sensory': return { icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' };
                default: return { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
            }
        }
        case 'measurement':
            return { icon: Scale, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
        case 'photo':
            return { icon: Image, color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200' };
        case 'note':
            return { icon: StickyNote, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
        default:
            return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
}

function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Timeline() {
    const { activeChild } = useChild();
    const child = activeChild;

    const [entries, setEntries] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<EntryType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    // Add entry form state
    const [newEntry, setNewEntry] = useState({
        type: 'note' as 'note' | 'measurement',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        weight: '',
        height: '',
        headCircumference: '',
    });

    const fetchEntries = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        try {
            const response = await api.get(`/timeline/${child._id}`);
            setEntries(response.data.entries || []);
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
        } finally {
            setLoading(false);
        }
    }, [child?._id]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const filteredEntries = entries
        .filter(e => filter === 'all' || e.type === filter)
        .filter(e => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                e.title?.toLowerCase().includes(q) ||
                e.description?.toLowerCase().includes(q)
            );
        });

    const handleAddEntry = async () => {
        if (!child?._id) return;
        setSubmitting(true);

        try {
            if (newEntry.type === 'measurement') {
                await api.post('/timeline/measurement', {
                    childId: child._id,
                    weight: newEntry.weight ? parseFloat(newEntry.weight) : undefined,
                    height: newEntry.height ? parseFloat(newEntry.height) : undefined,
                    headCircumference: newEntry.headCircumference ? parseFloat(newEntry.headCircumference) : undefined,
                    date: newEntry.date,
                    notes: newEntry.description,
                });
            } else {
                await api.post('/timeline', {
                    childId: child._id,
                    type: 'note',
                    title: newEntry.title,
                    description: newEntry.description,
                    date: newEntry.date,
                });
            }

            setShowAddForm(false);
            setNewEntry({
                type: 'note',
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                weight: '',
                height: '',
                headCircumference: '',
            });
            await fetchEntries();
        } catch (error) {
            console.error('Failed to add entry:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (entryId: string) => {
        if (!child?._id) return;
        setDeleting(true);
        try {
            await api.delete(`/timeline/${child._id}/${entryId}`);
            setEntries(prev => prev.filter(e => e._id !== entryId));
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Failed to delete entry:', error);
        } finally {
            setDeleting(false);
        }
    };

    // Stats
    const totalEntries = entries.length;
    const milestoneCount = entries.filter(e => e.type === 'milestone').length;
    const analysisCount = entries.filter(e => e.type === 'analysis').length;
    const measurementCount = entries.filter(e => e.type === 'measurement').length;

    if (!child) {
        return (
            <>
                <TopBar title="Timeline" subtitle="Track your child's journey" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view the timeline.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar title="Timeline" subtitle={`${child.name}'s growth journey`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Clock className="w-4.5 h-4.5 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">Total Entries</span>
                        </div>
                        <span className="text-3xl font-bold font-heading text-gray-900">{totalEntries}</span>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Trophy className="w-4.5 h-4.5 text-amber-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">Milestones</span>
                        </div>
                        <span className="text-3xl font-bold font-heading text-gray-900">{milestoneCount}</span>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Camera className="w-4.5 h-4.5 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">Analyses</span>
                        </div>
                        <span className="text-3xl font-bold font-heading text-gray-900">{analysisCount}</span>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Scale className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-500">Measurements</span>
                        </div>
                        <span className="text-3xl font-bold font-heading text-gray-900">{measurementCount}</span>
                    </div>
                </div>

                {/* Toolbar: Search + Filters + Add button */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Search */}
                    <div className="flex items-center bg-white rounded-xl border border-gray-100 px-3 py-2.5 w-full md:w-72 shadow-sm">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none ml-2 text-sm w-full text-gray-700 placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                        {ENTRY_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id)}
                                className={twMerge(
                                    'px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5 flex items-center gap-2',
                                    filter === t.id
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-white text-gray-600 border border-gray-100'
                                )}
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Add entry button */}
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add Entry
                    </button>
                </div>

                {/* Timeline entries */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredEntries.length > 0 ? (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-100" />

                        <div className="flex flex-col gap-4">
                            {filteredEntries.map((entry) => {
                                const domain = entry.data?.domain;
                                const style = getEntryStyle(entry.type, domain);
                                const Icon = style.icon;
                                const isExpanded = expandedEntry === entry._id;
                                const hasExpandableContent = (entry.description && entry.description.length > 100) || entry.mediaPath || (entry.type === 'measurement' && entry.data);

                                return (
                                    <div key={entry._id} className="flex gap-4 relative">
                                        {/* Icon dot */}
                                        <div className={`w-[46px] h-[46px] rounded-xl ${style.bg} flex items-center justify-center shrink-0 z-10 border ${style.border}`}>
                                            <Icon className={`w-5 h-5 ${style.color}`} />
                                        </div>

                                        {/* Card */}
                                        <div
                                            onClick={() => hasExpandableContent && setExpandedEntry(isExpanded ? null : entry._id)}
                                            className={twMerge(
                                                'flex-1 bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 hover:shadow-md transition-all group',
                                                entry.type === 'milestone' && 'border-l-4 border-l-amber-400',
                                                hasExpandableContent && 'cursor-pointer'
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={twMerge(
                                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider',
                                                            style.bg, style.color
                                                        )}>
                                                            {entry.type}
                                                        </span>
                                                        {domain && (
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                                {domain}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 mt-2">{entry.title}</h4>
                                                    {entry.description && (
                                                        <p className={twMerge(
                                                            'text-sm text-gray-500 mt-1',
                                                            !isExpanded && 'line-clamp-2'
                                                        )}>
                                                            {entry.description}
                                                        </p>
                                                    )}

                                                    {/* Measurement-specific data */}
                                                    {entry.type === 'measurement' && entry.data && (
                                                        <div className="flex gap-4 mt-3">
                                                            {entry.data.weight && (
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                                                                    <span className="font-semibold text-gray-700">{entry.data.weight} kg</span>
                                                                </div>
                                                            )}
                                                            {entry.data.height && (
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                                                    <span className="font-semibold text-gray-700">{entry.data.height} cm</span>
                                                                </div>
                                                            )}
                                                            {entry.data.headCircumference && (
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    <Brain className="w-3.5 h-3.5 text-purple-500" />
                                                                    <span className="font-semibold text-gray-700">{entry.data.headCircumference} cm</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Expanded: show media */}
                                                    {isExpanded && entry.mediaPath && (
                                                        <img
                                                            src={entry.mediaPath}
                                                            alt=""
                                                            className="mt-3 rounded-xl w-full h-48 object-cover"
                                                        />
                                                    )}

                                                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatRelativeDate(entry.date)}
                                                        <span className="mx-1">-</span>
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {/* Delete button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(entry._id); }}
                                                        className="opacity-0 group-hover:opacity-100 transition p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                                                        title="Delete entry"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {/* Expand indicator */}
                                                    {hasExpandableContent && (
                                                        <div className="p-1.5 text-gray-300 group-hover:text-gray-500 transition">
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!isExpanded && entry.mediaPath && (
                                                <img
                                                    src={entry.mediaPath}
                                                    alt=""
                                                    className="mt-3 rounded-xl w-full h-40 object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {searchQuery ? 'No matching entries' : 'No entries yet'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {searchQuery
                                ? 'Try a different search term or filter.'
                                : `Start tracking ${child.name}'s growth journey by adding an entry.`}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-4 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition"
                            >
                                Add First Entry
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Add Entry Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-bold text-gray-900">Add Timeline Entry</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Type toggle */}
                        <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl mb-5">
                            <button
                                onClick={() => setNewEntry(prev => ({ ...prev, type: 'note' }))}
                                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                    newEntry.type === 'note'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <StickyNote className="w-4 h-4" /> Note
                            </button>
                            <button
                                onClick={() => setNewEntry(prev => ({ ...prev, type: 'measurement' }))}
                                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                                    newEntry.type === 'measurement'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Scale className="w-4 h-4" /> Measurement
                            </button>
                        </div>

                        <div className="space-y-4">
                            {newEntry.type === 'note' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newEntry.title}
                                        onChange={e => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., First smile, Doctor visit..."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {newEntry.type === 'measurement' ? 'Notes (optional)' : 'Description (optional)'}
                                </label>
                                <textarea
                                    value={newEntry.description}
                                    onChange={e => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={newEntry.type === 'measurement' ? 'Any notes about this measurement...' : 'Add some details...'}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none outline-none text-sm"
                                    rows={2}
                                />
                            </div>

                            {newEntry.type === 'measurement' && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newEntry.weight}
                                            onChange={e => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
                                            placeholder="e.g., 8.5"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newEntry.height}
                                            onChange={e => setNewEntry(prev => ({ ...prev, height: e.target.value }))}
                                            placeholder="e.g., 72"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Head (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newEntry.headCircumference}
                                            onChange={e => setNewEntry(prev => ({ ...prev, headCircumference: e.target.value }))}
                                            placeholder="e.g., 45"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Date
                                </label>
                                <input
                                    type="date"
                                    value={newEntry.date}
                                    onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEntry}
                                disabled={submitting || (newEntry.type === 'note' && !newEntry.title.trim()) || (newEntry.type === 'measurement' && !newEntry.weight && !newEntry.height)}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg disabled:opacity-50 transition"
                            >
                                {submitting ? 'Adding...' : 'Add Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmId(null)}>
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Entry?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The entry will be permanently removed.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
