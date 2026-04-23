import { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/TopBar';
import {
    Sparkles, Brain, Activity, MessageCircle, Heart, Loader2, RefreshCw,
    TrendingUp, TrendingDown, Minus, ChevronRight, Target, X,
    AlertCircle, CheckCircle2, Eye
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api from '../api';
import { useAppConfig } from '../hooks/useAppConfig';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DomainAssessment {
    domain: string;
    score: number;
    status: string;
    observations: string[];
    strengths: string[];
    areasToSupport: string[];
    activities: string[];
    achievedMilestones?: { id: string; title: string; achievedDate?: string }[];
    upcomingMilestones?: { id: string; title: string; typicalMonths?: number }[];
}

interface AnalysisData {
    _id: string;
    overallScore: number;
    overallStatus: string;
    summary: string;
    motorAssessment: DomainAssessment;
    cognitiveAssessment: DomainAssessment;
    languageAssessment: DomainAssessment;
    socialAssessment: DomainAssessment;
    personalizedTips: string[];
    createdAt: string;
    childAgeAtAnalysis: number;
}

type DomainKey = 'motor' | 'cognitive' | 'language' | 'social';

// ─── Constants (fallback, overridden by config) ──────────────────────────────

const FALLBACK_TIME_FILTERS = [
    { id: '1W', label: '1W', days: 7 },
    { id: '1M', label: '1M', days: 30 },
    { id: '3M', label: '3M', days: 90 },
    { id: 'ALL', label: 'All', days: 9999 },
];

// Tailwind class mapping from hex domain colors
const DOMAIN_TW: Record<string, { bgClass: string; textClass: string; borderClass: string; iconBg: string }> = {
    '#3b82f6': { bgClass: 'bg-blue-50', textClass: 'text-blue-600', borderClass: 'border-blue-200', iconBg: 'bg-blue-100' },
    '#8b5cf6': { bgClass: 'bg-purple-50', textClass: 'text-purple-600', borderClass: 'border-purple-200', iconBg: 'bg-purple-100' },
    '#ec4899': { bgClass: 'bg-pink-50', textClass: 'text-pink-600', borderClass: 'border-pink-200', iconBg: 'bg-pink-100' },
    '#f59e0b': { bgClass: 'bg-amber-50', textClass: 'text-amber-600', borderClass: 'border-amber-200', iconBg: 'bg-amber-100' },
    '#10b981': { bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', borderClass: 'border-emerald-200', iconBg: 'bg-emerald-100' },
    '#06b6d4': { bgClass: 'bg-cyan-50', textClass: 'text-cyan-600', borderClass: 'border-cyan-200', iconBg: 'bg-cyan-100' },
};

const DOMAIN_ICON_MAP: Record<string, React.ReactNode> = {
    motor: <Activity className="w-6 h-6 text-blue-500" />,
    cognitive: <Brain className="w-6 h-6 text-purple-500" />,
    language: <MessageCircle className="w-6 h-6 text-pink-500" />,
    social: <Heart className="w-6 h-6 text-emerald-500" />,
};

const DOMAINS: DomainKey[] = ['motor', 'cognitive', 'language', 'social'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// These are used as standalone functions; config is accessed in the component
function formatStatus(status: string, statuses?: Record<string, any>): string {
    if (statuses?.[status]) return statuses[status].label;
    const map: Record<string, string> = {
        on_track: 'On Track',
        on_track_with_monitoring: 'On Track (Monitoring)',
        emerging: 'Emerging',
        needs_support: 'Needs Support',
    };
    return map[status] || status;
}

function statusBadgeClasses(status: string, statuses?: Record<string, any>): string {
    if (statuses?.[status]) {
        const colorMap: Record<string, string> = {
            '#10b981': 'bg-emerald-50 text-emerald-700',
            '#059669': 'bg-emerald-50 text-emerald-700',
            '#0ea5e9': 'bg-sky-50 text-sky-700',
            '#f59e0b': 'bg-amber-50 text-amber-700',
            '#ef4444': 'bg-red-50 text-red-700',
        };
        return colorMap[statuses[status].color] || 'bg-gray-50 text-gray-700';
    }
    switch (status) {
        case 'on_track': return 'bg-emerald-50 text-emerald-700';
        case 'on_track_with_monitoring': return 'bg-sky-50 text-sky-700';
        case 'emerging': return 'bg-amber-50 text-amber-700';
        case 'needs_support': return 'bg-red-50 text-red-700';
        default: return 'bg-gray-50 text-gray-700';
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Insights() {
    const { activeChild } = useChild();
    const { config } = useAppConfig();
    const child = activeChild;

    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [timeFilter, setTimeFilter] = useState('ALL');
    const [selectedDomain, setSelectedDomain] = useState<DomainKey | null>(null);

    // Trends data from backend
    const [trendData, setTrendData] = useState<{
        chartData: any[];
        trends: Record<string, { direction: string; diff: number; latestScore: number; previousScore: number }>;
        milestoneStats: { achieved: number; upcoming: number };
        analysisCount: number;
    } | null>(null);

    // Build domain config from API config
    const DOMAIN_CONFIG = useMemo(() => {
        const fallback: Record<DomainKey, { label: string; emoji: string; color: string; bgClass: string; textClass: string; borderClass: string; iconBg: string; assessmentKey: keyof Pick<AnalysisData, 'motorAssessment' | 'cognitiveAssessment' | 'languageAssessment' | 'socialAssessment'>; icon: React.ReactNode }> = {
            motor: { label: 'Motor Skills', emoji: '🏃', color: '#3b82f6', bgClass: 'bg-blue-50', textClass: 'text-blue-600', borderClass: 'border-blue-200', iconBg: 'bg-blue-100', assessmentKey: 'motorAssessment', icon: DOMAIN_ICON_MAP.motor },
            cognitive: { label: 'Cognitive', emoji: '🧠', color: '#8b5cf6', bgClass: 'bg-purple-50', textClass: 'text-purple-600', borderClass: 'border-purple-200', iconBg: 'bg-purple-100', assessmentKey: 'cognitiveAssessment', icon: DOMAIN_ICON_MAP.cognitive },
            language: { label: 'Language', emoji: '💬', color: '#ec4899', bgClass: 'bg-pink-50', textClass: 'text-pink-600', borderClass: 'border-pink-200', iconBg: 'bg-pink-100', assessmentKey: 'languageAssessment', icon: DOMAIN_ICON_MAP.language },
            social: { label: 'Social & Emotional', emoji: '❤️', color: '#10b981', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', borderClass: 'border-emerald-200', iconBg: 'bg-emerald-100', assessmentKey: 'socialAssessment', icon: DOMAIN_ICON_MAP.social },
        };

        if (!config?.domains) return fallback;

        const result = { ...fallback };
        for (const dk of DOMAINS) {
            const apiDomain = config.domains[dk];
            if (apiDomain) {
                const tw = DOMAIN_TW[apiDomain.color] || { bgClass: 'bg-gray-50', textClass: 'text-gray-600', borderClass: 'border-gray-200', iconBg: 'bg-gray-100' };
                result[dk] = {
                    ...result[dk],
                    label: apiDomain.label,
                    emoji: apiDomain.emoji,
                    color: apiDomain.color,
                    ...tw,
                };
            }
        }
        return result;
    }, [config?.domains]);

    // Build time filters from config
    const timeFilters = useMemo(() => {
        if (!config?.timeFilters) return FALLBACK_TIME_FILTERS;
        return config.timeFilters.map(f => ({
            id: f.id,
            label: f.id, // short label for pills
            days: f.days ?? 9999,
        }));
    }, [config?.timeFilters]);

    // ─── Fetch ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!child?._id) return;
        fetchData();
    }, [child?._id, timeFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Map timeFilter to backend period param
            const periodMap: Record<string, string> = { '1W': '1W', '1M': '1M', '3M': '3M', '6M': '6M', 'ALL': 'ALL' };
            const period = periodMap[timeFilter] || 'ALL';

            const [analysesRes, trendsRes] = await Promise.all([
                api.get(`/analysis/${child!._id}`),
                api.get(`/analysis/${child!._id}/trends`, { params: { period } }),
            ]);

            setAnalyses(analysesRes.data.analyses || []);
            setTrendData(trendsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ─── Filtered data (use backend trend data for chart, local for latest) ─

    const filteredAnalyses = useMemo(() => {
        const filter = timeFilters.find(f => f.id === timeFilter);
        if (!filter || filter.id === 'ALL') return analyses;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (filter.days || 9999));
        return analyses.filter(a => new Date(a.createdAt) >= cutoff);
    }, [analyses, timeFilter, timeFilters]);

    const latest = filteredAnalyses.length > 0 ? filteredAnalyses[0] : null;

    // ─── Chart data from backend ────────────────────────────────────────────

    const chartData = useMemo(() => {
        if (trendData?.chartData && trendData.chartData.length > 0) {
            return trendData.chartData.map(d => ({
                date: d.dateLabel || new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                motor: d.motor ?? 0,
                cognitive: d.cognitive ?? 0,
                language: d.language ?? 0,
                social: d.social ?? 0,
                overall: d.overall,
            }));
        }
        // Fallback to local computation
        return filteredAnalyses
            .slice()
            .reverse()
            .map(a => ({
                date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                motor: a.motorAssessment?.score ?? 0,
                cognitive: a.cognitiveAssessment?.score ?? 0,
                language: a.languageAssessment?.score ?? 0,
                social: a.socialAssessment?.score ?? 0,
                overall: a.overallScore,
            }));
    }, [trendData, filteredAnalyses]);

    // ─── Domain helpers ─────────────────────────────────────────────────────

    const getAssessment = (analysis: AnalysisData, domain: DomainKey): DomainAssessment | undefined => {
        return analysis[DOMAIN_CONFIG[domain].assessmentKey];
    };

    const getLatestScore = (domain: DomainKey): number => {
        if (!latest) return 0;
        return getAssessment(latest, domain)?.score ?? 0;
    };

    const getLatestStatus = (domain: DomainKey): string => {
        if (!latest) return 'on_track';
        return getAssessment(latest, domain)?.status ?? 'on_track';
    };

    const getTopObservation = (domain: DomainKey): string => {
        if (!latest) return '';
        const assessment = getAssessment(latest, domain);
        return assessment?.observations?.[0] || assessment?.strengths?.[0] || '';
    };

    const getTrend = (domain: DomainKey): 'up' | 'down' | 'stable' => {
        // Use backend trends if available
        if (trendData?.trends?.[domain]) {
            return trendData.trends[domain].direction as 'up' | 'down' | 'stable';
        }
        if (filteredAnalyses.length < 2) return 'stable';
        const latestScore = getAssessment(filteredAnalyses[0], domain)?.score ?? 0;
        const previousScore = getAssessment(filteredAnalyses[1], domain)?.score ?? 0;
        if (latestScore > previousScore + 2) return 'up';
        if (latestScore < previousScore - 2) return 'down';
        return 'stable';
    };

    // ─── Milestone velocity (from backend) ──────────────────────────────────

    const milestoneStats = useMemo(() => {
        if (trendData?.milestoneStats) return trendData.milestoneStats;
        // Fallback
        let achieved = 0;
        let upcoming = 0;
        for (const a of filteredAnalyses) {
            for (const dk of DOMAINS) {
                const assessment = getAssessment(a, dk);
                achieved += assessment?.achievedMilestones?.length ?? 0;
                upcoming += assessment?.upcomingMilestones?.length ?? 0;
            }
        }
        return { achieved, upcoming };
    }, [trendData, filteredAnalyses]);

    // ─── Trend UI helpers ───────────────────────────────────────────────────

    const TrendBadge = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
        if (trend === 'up') {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" /> Improving
                </span>
            );
        }
        if (trend === 'down') {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3.5 h-3.5" /> Declining
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <Minus className="w-3.5 h-3.5" /> Stable
            </span>
        );
    };

    // ─── Overall score ring ─────────────────────────────────────────────────

    const OverallScoreRing = ({ score }: { score: number }) => {
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

        return (
            <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                        cx="64" cy="64" r={radius} fill="none"
                        stroke={scoreColor} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{score}</span>
                    <span className="text-xs text-gray-500 font-medium">/ 100</span>
                </div>
            </div>
        );
    };

    // ─── Custom tooltip ─────────────────────────────────────────────────────

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[180px]">
                <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-gray-600">{entry.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    // ─── Domain detail modal ────────────────────────────────────────────────

    const DomainDetailModal = () => {
        if (!selectedDomain || !latest) return null;
        const domainCfg = DOMAIN_CONFIG[selectedDomain];
        const assessment = getAssessment(latest, selectedDomain);
        if (!assessment) return null;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDomain(null)}>
                <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className={`p-6 pb-4 border-b ${domainCfg.borderClass} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl ${domainCfg.iconBg} flex items-center justify-center`}>
                                <span className="text-2xl">{domainCfg.emoji}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{domainCfg.label}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-lg font-bold ${domainCfg.textClass}`}>{assessment.score}/100</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClasses(assessment.status, config?.statuses)}`}>
                                        {formatStatus(assessment.status, config?.statuses)}
                                    </span>
                                    <TrendBadge trend={getTrend(selectedDomain)} />
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDomain(null)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Observations */}
                        {assessment.observations && assessment.observations.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-500" /> Observations
                                </h4>
                                <ul className="space-y-2">
                                    {assessment.observations.map((obs, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                            {obs}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Strengths */}
                        {assessment.strengths && assessment.strengths.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {assessment.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Areas to support / Recommendations */}
                        {assessment.areasToSupport && assessment.areasToSupport.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-500" /> Recommendations
                                </h4>
                                <ul className="space-y-2">
                                    {assessment.areasToSupport.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Activities */}
                        {assessment.activities && assessment.activities.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" /> Suggested Activities
                                </h4>
                                <div className="grid gap-2">
                                    {assessment.activities.map((act, i) => (
                                        <div key={i} className={`${domainCfg.bgClass} rounded-xl px-4 py-3 text-sm text-gray-800`}>
                                            {act}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Achieved milestones */}
                        {assessment.achievedMilestones && assessment.achievedMilestones.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-500" /> Achieved Milestones
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {assessment.achievedMilestones.map((m, i) => (
                                        <span key={i} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                            {m.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming milestones */}
                        {assessment.upcomingMilestones && assessment.upcomingMilestones.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-amber-500" /> Upcoming Milestones
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {assessment.upcomingMilestones.map((m, i) => (
                                        <span key={i} className="bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                            {m.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Empty / loading states ─────────────────────────────────────────────

    if (!child) {
        return (
            <>
                <TopBar title="Development Insights" subtitle="Track progress over time" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view insights.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar title="Development Insights" subtitle={`Tracking ${child.name}'s progress over time`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-8">

                {/* ── Hero: Overall Score + Headline + Time Filters ────────────── */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] p-8 lg:p-10 text-white shadow-[0_8px_32px_rgba(16,185,129,0.2)] relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-8 items-center relative z-10">
                        {/* Left: info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4 bg-white/20 w-max px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-emerald-100" />
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-50">
                                    {latest ? 'Latest Analysis' : 'No Analyses Yet'}
                                </span>
                            </div>

                            {latest ? (
                                <>
                                    <h2 className="text-2xl lg:text-3xl font-bold font-heading mb-3 leading-tight">
                                        {latest.summary || `${child.name}'s Development Overview`}
                                    </h2>
                                    <p className="text-emerald-50 font-medium leading-relaxed mb-5 text-sm lg:text-base">
                                        Overall score of <span className="font-bold text-white">{latest.overallScore}/100</span> across {filteredAnalyses.length} analysis{filteredAnalyses.length !== 1 ? 'es' : ''} in the selected period.
                                        {latest.overallStatus === 'on_track' && ' Everything looks great -- keep it up!'}
                                        {latest.overallStatus === 'on_track_with_monitoring' && ' Looking good overall -- keep an eye on a few areas.'}
                                        {latest.overallStatus === 'emerging' && ' Some areas are developing -- consistent engagement will help.'}
                                        {latest.overallStatus === 'needs_support' && ' Some areas may benefit from extra attention.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl lg:text-3xl font-bold font-heading mb-3 leading-tight">
                                        Run your first analysis!
                                    </h2>
                                    <p className="text-emerald-50 font-medium leading-relaxed mb-5">
                                        Upload a photo or video of {child.name} to get AI-powered developmental insights across motor, cognitive, language, and social domains.
                                    </p>
                                </>
                            )}

                            {/* Time filter pills */}
                            <div className="flex gap-2">
                                {timeFilters.map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setTimeFilter(filter.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${timeFilter === filter.id
                                            ? 'bg-white text-emerald-700 shadow-lg'
                                            : 'bg-white/15 text-white/90 hover:bg-white/25'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: overall score ring */}
                        {latest && (
                            <div className="flex flex-col items-center gap-2">
                                <OverallScoreRing score={latest.overallScore} />
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${latest.overallStatus === 'on_track' ? 'bg-white/25 text-white'
                                    : latest.overallStatus === 'on_track_with_monitoring' ? 'bg-sky-400/30 text-sky-100'
                                    : latest.overallStatus === 'emerging' ? 'bg-yellow-400/30 text-yellow-100'
                                        : 'bg-red-400/30 text-red-100'
                                    }`}>
                                    {formatStatus(latest.overallStatus, config?.statuses)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Decorative blobs */}
                    <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 top-10 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* ── Section header with refresh ─────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-heading text-gray-900">
                        {latest ? 'Development Trend' : 'Getting Started'}
                    </h3>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : !latest ? (
                    <div className="bg-white rounded-[24px] p-12 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">No analyses yet</h4>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            Go to the Analysis page to upload a photo or video and get your first developmental assessment for {child.name}.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Trend Chart ──────────────────────────────────────── */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50">
                            {chartData.length < 2 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-sm">
                                        Need at least 2 analyses to show trends. Run more analyses to see your chart!
                                    </p>
                                </div>
                            ) : (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value: string) => <span className="text-xs text-gray-600 font-medium">{value}</span>}
                                            />
                                            {DOMAINS.map(domain => (
                                                <Line
                                                    key={domain}
                                                    type="monotone"
                                                    dataKey={domain}
                                                    stroke={DOMAIN_CONFIG[domain].color}
                                                    strokeWidth={2.5}
                                                    dot={{ r: 4, fill: DOMAIN_CONFIG[domain].color, strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                                    name={DOMAIN_CONFIG[domain].label}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* ── Domain Detail Cards ──────────────────────────────── */}
                        <div>
                            <h3 className="text-xl font-bold font-heading text-gray-900 mb-4">Domain Details</h3>
                            <div className="grid lg:grid-cols-2 gap-4">
                                {DOMAINS.map(domain => {
                                    const dc = DOMAIN_CONFIG[domain];
                                    const score = getLatestScore(domain);
                                    const status = getLatestStatus(domain);
                                    const trend = getTrend(domain);
                                    const topObs = getTopObservation(domain);

                                    return (
                                        <button
                                            key={domain}
                                            onClick={() => setSelectedDomain(domain)}
                                            className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-lg hover:border-gray-100 transition-all text-left group w-full"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl ${dc.iconBg} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-2xl">{dc.emoji}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition">{dc.label}</h4>
                                                        <TrendBadge trend={trend} />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xl font-bold ${dc.textClass}`}>{score}</span>
                                                        <span className="text-xs text-gray-400 font-medium">/100</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadgeClasses(status, config?.statuses)}`}>
                                                            {formatStatus(status, config?.statuses)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-400 transition flex-shrink-0" />
                                            </div>
                                            {topObs && (
                                                <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed pl-[4.5rem]">
                                                    {topObs}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Stats Row: Milestone Velocity + Personalized Tips ── */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Milestone Velocity */}
                            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-emerald-500" />
                                    Milestone Velocity
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-5 bg-emerald-50 rounded-2xl">
                                        <p className="text-3xl font-bold text-emerald-600">{milestoneStats.achieved}</p>
                                        <p className="text-xs text-gray-600 mt-1 font-medium">Achieved</p>
                                    </div>
                                    <div className="text-center p-5 bg-amber-50 rounded-2xl">
                                        <p className="text-3xl font-bold text-amber-600">{milestoneStats.upcoming}</p>
                                        <p className="text-xs text-gray-600 mt-1 font-medium">In Progress</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-3">
                                    Based on {filteredAnalyses.length} analysis{filteredAnalyses.length !== 1 ? 'es' : ''} in selected period
                                </p>
                            </div>

                            {/* Personalized Tips */}
                            {latest?.personalizedTips && latest.personalizedTips.length > 0 && (
                                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Personalized Tips
                                    </h3>
                                    <ul className="space-y-3">
                                        {latest.personalizedTips.slice(0, 4).map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                                                <span className="leading-relaxed">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* ── Reminder ────────────────────────────────────────── */}
                        <div className="bg-emerald-50 rounded-[24px] p-6 border border-emerald-100/50 flex items-start gap-4">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Remember</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Every child develops at their own pace. These scores are informational and should not replace professional medical advice.
                                    Celebrate every small win! If you have concerns about {child.name}'s development, consult your pediatrician.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Domain detail modal */}
            <DomainDetailModal />
        </>
    );
}
