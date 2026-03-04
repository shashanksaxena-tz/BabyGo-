import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { CheckCircle2, Circle, RefreshCw, Eye, EyeOff, Calendar, X, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useChild } from '../contexts/ChildContext';
import api from '../api';

interface AchievedMilestone {
    milestoneId: string;
    achievedDate: string;
    confirmedBy: 'parent' | 'analysis';
    notes?: string;
}

interface Milestone {
    id: string;
    title: string;
    description: string;
    domain: 'motor' | 'language' | 'cognitive' | 'social' | 'sensory';
    minMonths: number;
    maxMonths: number;
    typicalMonths: number;
}

type DomainFilter = 'all' | 'motor' | 'language' | 'cognitive' | 'social' | 'sensory';
type TabType = 'current' | 'upcoming' | 'achieved';

export default function Milestones() {
    const { activeChild } = useChild();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [upcomingSidebar, setUpcomingSidebar] = useState<Milestone[]>([]);
    const [milestoneCounts, setMilestoneCounts] = useState<{ current: number; upcoming: number; achieved: number; total: number }>({ current: 0, upcoming: 0, achieved: 0, total: 0 });
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<DomainFilter>('all');
    const [achievedMilestones, setAchievedMilestones] = useState<Map<string, AchievedMilestone>>(new Map());
    const [watchedMilestones, setWatchedMilestones] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<TabType>('current');
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [achievementDate, setAchievementDate] = useState(new Date().toISOString().split('T')[0]);
    const [achievementNotes, setAchievementNotes] = useState('');

    const child = activeChild;

    // Use computed ageInMonths from API response, fallback to local calc
    const ageMonths = (child as any)?.ageInMonths ?? (() => {
        if (!child?.dateOfBirth) return 12;
        const today = new Date();
        const dob = new Date(child.dateOfBirth);
        return (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    })();

    // Fetch milestones from backend API with filtering
    const fetchMilestones = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        try {
            // Fetch milestones with server-side filtering
            const params: Record<string, string> = { childId: child._id };
            if (selectedDomain !== 'all') params.domain = selectedDomain;
            if (activeTab !== 'current') params.status = activeTab; // current is default

            params.status = activeTab;

            const [milestoneRes, childMilestoneRes, upcomingRes] = await Promise.all([
                api.get(`/analysis/milestones/${ageMonths}`, { params }),
                api.get(`/children/${child._id}/milestones`),
                // Always fetch upcoming for sidebar
                api.get(`/analysis/milestones/${ageMonths}`, { params: { childId: child._id, status: 'upcoming' } }),
            ]);

            const milestoneData = milestoneRes.data;
            setMilestones(milestoneData.milestones || []);
            setMilestoneCounts(milestoneData.counts || { current: 0, upcoming: 0, achieved: 0, total: 0 });
            setProgress(milestoneData.progress || 0);
            setUpcomingSidebar((upcomingRes.data.milestones || []).slice(0, 4));

            // Sync achieved/watched from child endpoint
            const childData = childMilestoneRes.data;
            const achievedMap = new Map<string, AchievedMilestone>();
            (childData.achievedMilestones || []).forEach((m: AchievedMilestone) => {
                achievedMap.set(m.milestoneId, m);
            });
            setAchievedMilestones(achievedMap);

            const watchedSet = new Set<string>();
            (childData.watchedMilestones || []).forEach((m: any) => {
                watchedSet.add(m.milestoneId);
            });
            setWatchedMilestones(watchedSet);
        } catch (error) {
            console.error('Failed to fetch milestones:', error);
        } finally {
            setLoading(false);
        }
    }, [child?._id, ageMonths, selectedDomain, activeTab]);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    // Mark milestone as achieved
    const markAchieved = async (milestoneId: string) => {
        setSyncing(true);
        const updateStateOnly = () => {
            setAchievedMilestones(prev => {
                const next = new Map(prev);
                next.set(milestoneId, {
                    milestoneId,
                    achievedDate: achievementDate,
                    confirmedBy: 'parent',
                    notes: achievementNotes,
                });
                return next;
            });
            setWatchedMilestones(prev => {
                const next = new Set(prev);
                next.delete(milestoneId);
                return next;
            });
        };

        try {
            await api.post(`/children/${child!._id}/milestones/${milestoneId}`, {
                achievedDate: achievementDate,
                notes: achievementNotes,
                confirmedBy: 'parent',
            });
            updateStateOnly();
        } catch (error) {
            console.warn('Backend error, updating UI only:', error);
            updateStateOnly();
        } finally {
            setSyncing(false);
            setShowDatePicker(false);
            setSelectedMilestone(null);
            setAchievementDate(new Date().toISOString().split('T')[0]);
            setAchievementNotes('');
        }
    };

    // Unmark milestone
    const unmarkAchieved = async (milestoneId: string) => {
        setSyncing(true);
        const removeFromState = () => {
            setAchievedMilestones(prev => {
                const next = new Map(prev);
                next.delete(milestoneId);
                return next;
            });
        };

        try {
            await api.delete(`/children/${child!._id}/milestones/${milestoneId}`);
            removeFromState();
        } catch (error) {
            console.warn('Backend error, updating UI only:', error);
            removeFromState();
        } finally {
            setSyncing(false);
        }
    };

    // Toggle watch milestone
    const toggleWatch = async (milestoneId: string) => {
        const isWatching = watchedMilestones.has(milestoneId);
        setSyncing(true);

        const updateWatchState = (add: boolean) => {
            setWatchedMilestones(prev => {
                const next = new Set(prev);
                if (add) next.add(milestoneId);
                else next.delete(milestoneId);
                return next;
            });
        };

        try {
            if (isWatching) {
                await api.delete(`/children/${child!._id}/milestones/${milestoneId}/watch`);
                updateWatchState(false);
            } else {
                await api.post(`/children/${child!._id}/milestones/${milestoneId}/watch`);
                updateWatchState(true);
            }
        } catch (error) {
            console.warn('Backend error, updating UI only:', error);
            updateWatchState(!isWatching);
        } finally {
            setSyncing(false);
        }
    };

    const getDomainInfo = (domain: string) => {
        switch (domain) {
            case 'motor': return { emoji: '🏃', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' };
            case 'language': return { emoji: '💬', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', dot: 'bg-pink-500' };
            case 'cognitive': return { emoji: '🧠', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' };
            case 'social': return { emoji: '❤️', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' };
            case 'sensory': return { emoji: '✨', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', dot: 'bg-teal-500' };
            default: return { emoji: '🎯', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-500' };
        }
    };

    const domains = [
        { id: 'all' as DomainFilter, label: 'All', dot: 'bg-emerald-500' },
        { id: 'motor' as DomainFilter, label: 'Motor', dot: 'bg-blue-500' },
        { id: 'cognitive' as DomainFilter, label: 'Cognitive', dot: 'bg-purple-500' },
        { id: 'language' as DomainFilter, label: 'Language', dot: 'bg-pink-500' },
        { id: 'social' as DomainFilter, label: 'Social', dot: 'bg-emerald-500' },
    ];

    // Milestones are now pre-filtered by the backend API
    const filteredMilestones = milestones;

    if (!child) {
        return (
            <>
                <TopBar title="Milestones" subtitle="Track developmental milestones" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view milestones.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar title="Milestones" subtitle={`Track ${child.name}'s developmental milestones`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">

                {/* Top metrics and Upcoming side-by-side on lg */}
                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="xl:w-3/4 flex flex-col gap-6">

                        {/* Top Cards row */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-center">
                                <span className="text-sm font-bold font-heading text-gray-900 mb-2">Milestones Achieved</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold font-heading text-gray-900">{milestoneCounts.achieved}</span>
                                    <span className="text-xl text-gray-400 font-bold font-heading">/{milestoneCounts.total}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-center gap-3">
                                <span className="text-sm font-bold font-heading text-gray-900">Current Progress</span>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-emerald-500">{progress.toFixed(0)}% of current milestones</span>
                            </div>

                            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-center">
                                <span className="text-sm font-bold font-heading text-gray-900 mb-2">Age</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold font-heading text-gray-900">{ageMonths} months old</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {domains.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedDomain(filter.id)}
                                    className={twMerge(
                                        "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5",
                                        selectedDomain === filter.id
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                            : 'bg-white text-gray-600 border border-gray-100',
                                        "flex items-center gap-2"
                                    )}
                                >
                                    {filter.id !== 'all' && <span className={`w-2 h-2 rounded-full ${selectedDomain === filter.id ? 'bg-white' : filter.dot}`} />}
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl">
                            {([
                                { id: 'current' as TabType, label: '🎯 Current' },
                                { id: 'upcoming' as TabType, label: '🚀 Upcoming' },
                                { id: 'achieved' as TabType, label: `🏆 Achieved (${milestoneCounts.achieved})` },
                            ]).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Milestone List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex-1">
                                {filteredMilestones.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold tracking-wide uppercase border-b border-gray-100">
                                                <th className="py-4 px-6 font-bold font-heading">Milestone</th>
                                                <th className="py-4 px-6 font-bold font-heading">Domain</th>
                                                <th className="py-4 px-6 font-bold font-heading">Expected Age</th>
                                                <th className="py-4 px-6 font-bold font-heading">Status</th>
                                                <th className="py-4 px-6 font-bold font-heading">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredMilestones.map(milestone => {
                                                const domainInfo = getDomainInfo(milestone.domain);
                                                const isAchieved = achievedMilestones.has(milestone.id);
                                                const isWatching = watchedMilestones.has(milestone.id);
                                                const achievementData = achievedMilestones.get(milestone.id);

                                                return (
                                                    <tr key={milestone.id} className="hover:bg-gray-50/50 transition duration-150">
                                                        <td className="py-4 px-6">
                                                            <div>
                                                                <p className="font-bold text-gray-800">{milestone.title}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                                                                {isAchieved && achievementData?.notes && (
                                                                    <p className="text-xs text-emerald-600 mt-1 italic">"{achievementData.notes}"</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${domainInfo.bg} ${domainInfo.text}`}>
                                                                {domainInfo.emoji} {milestone.domain}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                                                            {milestone.minMonths}-{milestone.maxMonths} months
                                                        </td>
                                                        <td className="py-4 px-6 text-sm">
                                                            {isAchieved ? (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                                                        <CheckCircle2 className="w-4 h-4" /> Achieved
                                                                    </div>
                                                                    {achievementData && (
                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date(achievementData.achievedDate).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : isWatching ? (
                                                                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                                                                    <Eye className="w-4 h-4" /> Watching
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                                                                    <Circle className="w-4 h-4" /> Pending
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                {!isAchieved && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedMilestone(milestone);
                                                                            setShowDatePicker(true);
                                                                        }}
                                                                        disabled={syncing}
                                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                                                                        title="Mark as achieved"
                                                                    >
                                                                        ✓ Mark
                                                                    </button>
                                                                )}
                                                                {isAchieved && (
                                                                    <button
                                                                        onClick={() => unmarkAchieved(milestone.id)}
                                                                        disabled={syncing}
                                                                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
                                                                        title="Remove achievement"
                                                                    >
                                                                        Undo
                                                                    </button>
                                                                )}
                                                                {!isAchieved && activeTab === 'upcoming' && (
                                                                    <button
                                                                        onClick={() => toggleWatch(milestone.id)}
                                                                        disabled={syncing}
                                                                        className={`p-1.5 rounded-lg transition disabled:opacity-50 ${isWatching
                                                                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500'
                                                                            }`}
                                                                        title={isWatching ? 'Stop watching' : 'Watch milestone'}
                                                                    >
                                                                        {isWatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">
                                                {activeTab === 'achieved' ? '🏆' : '🎯'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                                            {activeTab === 'achieved' ? 'No achievements yet' : 'No milestones found'}
                                        </h3>
                                        <p className="text-gray-500 text-sm">
                                            {activeTab === 'achieved'
                                                ? `Start marking ${child.name}'s achievements!`
                                                : activeTab === 'current'
                                                    ? 'All current milestones are in other domains'
                                                    : 'Check back as your child grows'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="xl:w-1/4 flex flex-col gap-6">
                        {/* Upcoming sidebar */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h3 className="text-lg font-bold font-heading text-gray-900">Upcoming</h3>
                                <span className="bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    {milestoneCounts.upcoming} left
                                </span>
                            </div>
                            <div className="flex flex-col gap-5 relative z-10">
                                {upcomingSidebar.map(m => {
                                        const domainInfo = getDomainInfo(m.domain);
                                        return (
                                            <div key={m.id} className="flex gap-3 items-start">
                                                <div className={`w-2 h-2 rounded-sm ${domainInfo.dot} mt-1.5 shrink-0`} />
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-gray-800 leading-snug">{m.title}</span>
                                                    <span className="text-[11px] font-medium text-gray-500 mt-0.5 capitalize">{m.domain} • {m.minMonths}-{m.maxMonths} months</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="text-3xl mb-3">💡</div>
                            <h3 className="text-lg font-bold font-heading mb-2">Pro Tip</h3>
                            <p className="text-sm font-medium text-emerald-50 leading-relaxed">
                                {ageMonths < 12
                                    ? "Place colorful toys just out of reach to encourage crawling and reaching — it builds motor skills and problem-solving!"
                                    : ageMonths < 24
                                        ? "Reading together for 15 minutes daily dramatically boosts language development at this age."
                                        : "Encourage jumping by placing 'lily pads' (like flat pillows) on the floor. It builds leg strength and coordination!"}
                            </p>
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        </div>

                        <button
                            onClick={fetchMilestones}
                            disabled={loading || syncing}
                            className="w-full flex justify-center items-center gap-2 bg-white text-emerald-600 border border-emerald-500 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading || syncing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Achievement Date Picker Modal */}
            {showDatePicker && selectedMilestone && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDatePicker(false)}>
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                🏆 Mark as Achieved
                            </h3>
                            <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <p className="font-medium text-gray-800">{selectedMilestone.title}</p>
                            <p className="text-sm text-gray-500">{selectedMilestone.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    When did {child.name} achieve this?
                                </label>
                                <input
                                    type="date"
                                    value={achievementDate}
                                    onChange={(e) => setAchievementDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    value={achievementNotes}
                                    onChange={(e) => setAchievementNotes(e.target.value)}
                                    placeholder="Any notes about this milestone..."
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none outline-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowDatePicker(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => markAchieved(selectedMilestone.id)}
                                disabled={syncing}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg disabled:opacity-50"
                            >
                                {syncing ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
