import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { TrendingUp, Moon, Camera, Activity } from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import api from '../api';

interface TimelineEntry {
    _id: string;
    type: string;
    title: string;
    description?: string;
    date: string;
    data?: Record<string, unknown>;
}

interface StoryEntry {
    _id: string;
    title: string;
    theme?: string | { name: string };
}

interface WatchedMilestone {
    milestoneId: string;
    addedDate: string;
}

export default function Dashboard() {
    const { activeChild } = useChild();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [_loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        overallScore: 0,
        domains: [
            { label: 'Motor', score: 0, color: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
            { label: 'Cognitive', score: 0, color: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
            { label: 'Language', score: 0, color: 'text-pink-500', border: 'border-pink-500', bg: 'bg-pink-50', dot: 'bg-pink-500' },
            { label: 'Social', score: 0, color: 'text-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' }
        ]
    });
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [stories, setStories] = useState<StoryEntry[]>([]);
    const [milestones, setMilestones] = useState<WatchedMilestone[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!activeChild?._id) return;
            setLoading(true);
            try {
                // Fetch recent timeline
                const timelineRes = await api.get(`/timeline/${activeChild._id}`);
                setTimeline(timelineRes.data.entries?.slice(0, 3) || []);

                // Fetch recent stories
                const storiesRes = await api.get(`/stories/${activeChild._id}`);
                setStories(storiesRes.data.stories?.slice(0, 2) || []);

                // Fetch watched milestones
                const milestonesRes = await api.get(`/children/${activeChild._id}/milestones`);
                setMilestones(milestonesRes.data.watchedMilestones?.slice(0, 3) || []);

                // Try to get latest analysis for score
                const analysisRes = await api.get(`/analysis/${activeChild._id}`);
                const latestAnalysis = analysisRes.data.analyses?.[0];
                if (latestAnalysis && latestAnalysis.overallScore != null) {
                    setStats({
                        overallScore: latestAnalysis.overallScore || 0,
                        domains: [
                            { label: 'Motor', score: latestAnalysis.motorAssessment?.score || 0, color: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
                            { label: 'Cognitive', score: latestAnalysis.cognitiveAssessment?.score || 0, color: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
                            { label: 'Language', score: latestAnalysis.languageAssessment?.score || 0, color: 'text-pink-500', border: 'border-pink-500', bg: 'bg-pink-50', dot: 'bg-pink-500' },
                            { label: 'Social', score: latestAnalysis.socialAssessment?.score || 0, color: 'text-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' }
                        ]
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [activeChild]);

    if (!activeChild) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <TopBar title="Welcome back," subtitle="Please select or add a child to continue" />
                <div className="mt-20 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">👶</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Child Selected</h2>
                    <button onClick={() => navigate('/create-child')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold">Add Child Profile</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <TopBar title={`Good morning, ${user?.name?.split(' ')[0] || 'Parent'}`} subtitle={`Here's how ${activeChild.name} is doing today`} />
            <div className="flex-1 p-8 grid lg:grid-cols-3 gap-8 overflow-y-auto w-full max-w-[1400px] mx-auto">

                {/* Left Column (2/3 width on LG) */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Overall Score */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between border border-gray-50">
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-[6px] border-emerald-500">
                                <span className="text-3xl font-bold font-heading text-emerald-500">{stats.overallScore}</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold font-heading text-gray-900 mb-1">Overall Development Score</h2>
                                <p className="text-sm text-gray-600 mb-3">
                                    {stats.overallScore > 0
                                        ? `${activeChild.name} is ${stats.overallScore >= 80 ? 'developing excellently' : stats.overallScore >= 60 ? 'progressing well' : 'making progress'} across all domains.`
                                        : `Upload a video analysis to see ${activeChild.name}'s development score.`}
                                </p>
                                {stats.overallScore > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-semibold">
                                        <TrendingUp className="w-3 h-3" /> Based on latest analysis
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 font-bold text-3xl">
                                {activeChild.name.charAt(0)}
                            </div>
                        </div>
                    </div>

                    {/* Domain Scores */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.domains.map(domain => (
                            <div
                                key={domain.label}
                                onClick={() => navigate('/analysis')}
                                className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center gap-2 border border-gray-50 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className={`w-14 h-14 rounded-full border-[3px] ${domain.border} flex items-center justify-center mb-1`}>
                                    <span className={`text-xl font-bold font-heading ${domain.color}`}>{Math.round(domain.score)}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{domain.label}</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${domain.dot}`} />
                            </div>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-base font-bold font-heading text-gray-900 mb-5">Recent Activity</h3>
                        <div className="flex flex-col gap-6">
                            {timeline.length > 0 ? timeline.map((entry, index) => {
                                const getActivityRoute = (type: string) => {
                                    switch (type) {
                                        case 'analysis': return '/analysis';
                                        case 'milestone': return '/milestones';
                                        case 'measurement': return '/growth';
                                        case 'photo': return '/timeline';
                                        case 'note': return '/timeline';
                                        default: return '/timeline';
                                    }
                                };
                                return (
                                    <div
                                        key={entry._id || index}
                                        className="relative cursor-pointer group"
                                        onClick={() => navigate(getActivityRoute(entry.type))}
                                    >
                                        <div className="flex items-start gap-4 z-10 relative bg-white group-hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                                            <div className={`mt-1 w-2.5 h-2.5 rounded-full z-10 ${entry.type === 'milestone' ? 'bg-purple-500' : entry.type === 'analysis' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{entry.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(entry.date), 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        {index < timeline.length - 1 && (
                                            <div className="absolute left-1.5 top-3.5 bottom-[-24px] w-px bg-gray-100 -translate-x-1/2"></div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-gray-500 italic">No recent activity found. Try adding a growth measurement or completing an analysis!</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column (1/3 width on LG) */}
                <div className="flex flex-col gap-6">

                    {/* Upcoming Milestones */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-base font-bold font-heading text-gray-900 mb-5">Watched Milestones</h3>
                        <div className="flex flex-col gap-5">
                            {milestones.length > 0 ? milestones.map((m, idx) => (
                                <div key={m.milestoneId || idx} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center shrink-0 mt-0.5"></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {m.milestoneId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </p>
                                        <p className="text-xs text-gray-500">Watched since {format(new Date(m.addedDate), 'MMM d')}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic">You aren't watching any upcoming milestones yet. Visit the Milestones page to add some!</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-base font-bold font-heading text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/analysis')} className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-600 transition">
                                <Camera className="w-4 h-4" /> New Analysis
                            </button>
                            <button onClick={() => navigate('/growth')} className="w-full flex justify-center items-center gap-2 bg-white text-emerald-600 border border-emerald-500 font-semibold py-2.5 rounded-xl hover:bg-emerald-50 transition">
                                <Activity className="w-4 h-4" /> Log Measurement
                            </button>
                        </div>
                    </div>

                    {/* Recommended Stories */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="text-base font-bold font-heading text-gray-900 mb-4">Recent Stories</h3>
                        <div className="flex flex-col gap-4">
                            {stories.length > 0 ? stories.map((story) => (
                                <div key={story._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition" onClick={() => navigate('/stories')}>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                        <Moon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{story.title}</p>
                                        <p className="text-xs text-gray-500">{typeof story.theme === 'object' ? story.theme?.name : story.theme || 'Bedtime Story'}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 italic">No stories generated yet. Go to the Stories section to create a magical bedtime tale!</p>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}
