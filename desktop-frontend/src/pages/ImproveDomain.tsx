import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import {
    ArrowLeft,
    Play,
    BookOpen,
    Video,
    Gamepad2,
    Star,
    Clock,
    Sparkles,
    RefreshCw,
    ExternalLink,
    Loader2,
    Activity,
    Brain,
    MessageCircle,
    Heart,
    AlertCircle,
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { toast } from 'react-toastify';
import api from '../api';

// ─── Types ───────────────────────────────────────────────────────────────────

type DomainKey = 'motor' | 'cognitive' | 'language' | 'social';

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'activity' | 'book' | 'video' | 'toy';
    domain: string;
    imageUrl?: string;
    duration?: string;
    ageRange?: string;
    priority?: string;
    difficulty?: 'easy' | 'moderate' | 'challenging';
    url?: string;
    tags?: string[];
}

interface DomainAssessment {
    score: number;
    status: string;
    observations: string[];
    strengths: string[];
    areasToSupport: string[];
    activities: string[];
}

interface AnalysisData {
    motorAssessment?: DomainAssessment;
    cognitiveAssessment?: DomainAssessment;
    languageAssessment?: DomainAssessment;
    socialAssessment?: DomainAssessment;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<DomainKey, {
    label: string;
    emoji: string;
    color: string;
    gradient: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeBg: string;
    iconBg: string;
    icon: React.ReactNode;
    assessmentKey: string;
}> = {
    motor: {
        label: 'Motor Skills',
        emoji: '🏃',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-blue-600',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-600',
        borderClass: 'border-blue-200',
        badgeBg: 'bg-blue-100',
        iconBg: 'bg-blue-100',
        icon: <Activity className="w-6 h-6 text-blue-500" />,
        assessmentKey: 'motorAssessment',
    },
    cognitive: {
        label: 'Cognitive',
        emoji: '🧠',
        color: '#8b5cf6',
        gradient: 'from-purple-500 to-purple-600',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-600',
        borderClass: 'border-purple-200',
        badgeBg: 'bg-purple-100',
        iconBg: 'bg-purple-100',
        icon: <Brain className="w-6 h-6 text-purple-500" />,
        assessmentKey: 'cognitiveAssessment',
    },
    language: {
        label: 'Language',
        emoji: '💬',
        color: '#ec4899',
        gradient: 'from-pink-500 to-pink-600',
        bgClass: 'bg-pink-50',
        textClass: 'text-pink-600',
        borderClass: 'border-pink-200',
        badgeBg: 'bg-pink-100',
        iconBg: 'bg-pink-100',
        icon: <MessageCircle className="w-6 h-6 text-pink-500" />,
        assessmentKey: 'languageAssessment',
    },
    social: {
        label: 'Social & Emotional',
        emoji: '❤️',
        color: '#10b981',
        gradient: 'from-emerald-500 to-emerald-600',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-600',
        borderClass: 'border-emerald-200',
        badgeBg: 'bg-emerald-100',
        iconBg: 'bg-emerald-100',
        icon: <Heart className="w-6 h-6 text-emerald-500" />,
        assessmentKey: 'socialAssessment',
    },
};

const TABS = [
    { id: 'activity', label: 'Activities', icon: Play },
    { id: 'book', label: 'Books', icon: BookOpen },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'toy', label: 'Toys / Apps', icon: Gamepad2 },
] as const;

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    easy: { label: 'Easy', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    moderate: { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50' },
    challenging: { label: 'Challenging', color: 'text-red-700', bg: 'bg-red-50' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapResource(r: any): Resource {
    return {
        id: r._id || r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        domain: r.domain,
        imageUrl: r.imageUrl,
        duration: r.duration,
        ageRange: r.ageRange,
        priority: r.priority,
        difficulty: r.difficulty,
        url: r.sourceUrl || r.url,
        tags: r.tags,
    };
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'on_track': return 'On Track';
        case 'on_track_with_monitoring': return 'On Track (Monitoring)';
        case 'emerging': return 'Emerging';
        case 'needs_support': return 'Needs Support';
        case 'ahead': return 'Ahead';
        case 'on-track': return 'On Track';
        case 'monitor': return 'Monitor';
        case 'discuss': return 'Discuss';
        default: return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
    }
}

function getStatusBadgeColors(status: string): string {
    switch (status) {
        case 'on_track':
        case 'on-track':
        case 'ahead':
            return 'bg-emerald-100 text-emerald-700';
        case 'on_track_with_monitoring':
            return 'bg-sky-100 text-sky-700';
        case 'emerging':
        case 'monitor':
            return 'bg-amber-100 text-amber-700';
        case 'needs_support':
        case 'discuss':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImproveDomain() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { activeChild } = useChild();
    const child = activeChild;

    const domainParam = (searchParams.get('domain') || 'motor') as DomainKey;
    const domain: DomainKey = ['motor', 'cognitive', 'language', 'social'].includes(domainParam)
        ? domainParam
        : 'motor';

    const config = DOMAIN_CONFIG[domain];

    const [activeTab, setActiveTab] = useState<string>('activity');
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);

    // Domain score & status from latest analysis
    const [domainScore, setDomainScore] = useState<number>(0);
    const [domainStatus, setDomainStatus] = useState<string>('');
    const [assessment, setAssessment] = useState<DomainAssessment | null>(null);

    // ─── Fetch latest analysis for domain score ──────────────────────────────

    useEffect(() => {
        if (!child?._id) return;
        fetchDomainData();
    }, [child?._id, domain]);

    const fetchDomainData = async () => {
        try {
            const response = await api.get(`/analysis/${child!._id}`);
            const analyses = response.data.analyses || [];
            if (analyses.length > 0) {
                const latest = analyses[0] as AnalysisData;
                const assessmentData = latest[config.assessmentKey as keyof AnalysisData] as DomainAssessment | undefined;
                if (assessmentData) {
                    setDomainScore(assessmentData.score || 0);
                    setDomainStatus(assessmentData.status || '');
                    setAssessment(assessmentData);
                }
            }
        } catch (err) {
            console.error('Failed to fetch analysis:', err);
        }
    };

    // ─── Fetch resources ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!child?._id) return;
        fetchResources();
    }, [child?._id, domain, activeTab]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/resources/${child!._id}`, {
                params: { domain, type: activeTab },
            });
            const data = response.data;
            const rawResources = Array.isArray(data.resources)
                ? data.resources
                : Array.isArray(data) ? data : [];
            setResources(rawResources.map(mapResource));
        } catch (err) {
            console.error('Failed to fetch resources:', err);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Regenerate ──────────────────────────────────────────────────────────

    const handleRegenerate = async () => {
        if (!child?._id) return;
        setRegenerating(true);
        try {
            await api.post(`/resources/${child._id}/regenerate`);
            toast.success('Resources regenerated successfully!');
            await fetchResources();
        } catch (err: any) {
            console.error('Failed to regenerate resources:', err);
            const msg = err?.response?.data?.error || 'Failed to regenerate resources. Please try again.';
            toast.error(msg);
        } finally {
            setRegenerating(false);
        }
    };

    // ─── Derived ─────────────────────────────────────────────────────────────

    const featuredResource = resources.length > 0 ? resources[0] : null;
    const otherResources = resources.slice(1);
    const scoreColor = domainScore >= 70 ? '#10b981' : domainScore >= 50 ? '#f59e0b' : '#ef4444';

    // ─── Score Ring ──────────────────────────────────────────────────────────

    const ScoreRing = ({ score }: { score: number }) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="#ffffff30" strokeWidth="7" />
                    <circle
                        cx="48" cy="48" r={radius} fill="none"
                        stroke="white"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{score}</span>
                    <span className="text-[10px] text-white/70 font-medium">/100</span>
                </div>
            </div>
        );
    };

    // ─── Activity Detail Card ────────────────────────────────────────────────

    const ResourceCard = ({ resource, featured = false }: { resource: Resource; featured?: boolean }) => {
        const diffConfig = DIFFICULTY_CONFIG[resource.difficulty || ''] || null;
        const TabIcon = TABS.find(t => t.id === activeTab)?.icon || Play;

        return (
            <div className={`bg-white rounded-2xl overflow-hidden transition-all ${featured
                ? `shadow-lg border-2 ${config.borderClass}`
                : 'shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md'
                }`}
            >
                {featured && (
                    <div className={`${config.bgClass} px-5 py-2.5 flex items-center gap-2`}>
                        <Sparkles className={`w-4 h-4 ${config.textClass}`} />
                        <span className={`text-sm font-semibold ${config.textClass}`}>Top Priority</span>
                    </div>
                )}

                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {!featured && (
                            <div className={`w-11 h-11 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0`}>
                                <TabIcon className={`w-5 h-5 ${config.textClass}`} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-gray-900 ${featured ? 'text-lg' : 'text-sm'}`}>
                                {resource.title}
                            </h3>
                            <p className={`text-gray-600 mt-1.5 leading-relaxed ${featured ? 'text-sm' : 'text-xs line-clamp-2'}`}>
                                {resource.description}
                            </p>

                            {/* Meta badges */}
                            <div className="flex flex-wrap items-center gap-2.5 mt-3">
                                {resource.duration && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                        <Clock className="w-3.5 h-3.5" />
                                        {resource.duration}
                                    </span>
                                )}
                                {diffConfig && (
                                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${diffConfig.bg} ${diffConfig.color}`}>
                                        <Star className="w-3.5 h-3.5" />
                                        {diffConfig.label}
                                    </span>
                                )}
                                {resource.ageRange && (
                                    <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                        {resource.ageRange}
                                    </span>
                                )}
                            </div>

                            {/* Tags */}
                            {resource.tags && resource.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {resource.tags.map((tag, i) => (
                                        <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${config.badgeBg} ${config.textClass}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}


                            {/* External link */}
                            {resource.url && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${config.textClass} hover:opacity-80 transition`}
                                >
                                    Learn More <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Empty / Loading states ──────────────────────────────────────────────

    if (!child) {
        return (
            <>
                <TopBar title={`Improve ${config.label}`} subtitle="Activity plans and resources" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view improvement resources.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar
                title={`Improve ${config.label}`}
                subtitle={`Personalized resources for ${child.name}`}
            />
            <div className="flex-1 overflow-y-auto">

                {/* ── Hero Header ─────────────────────────────────────────────── */}
                <div className={`bg-gradient-to-r ${config.gradient} text-white relative overflow-hidden`}>
                    <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 relative z-10">
                        {/* Back + Title */}
                        <div className="flex-1">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition font-medium text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">{config.emoji}</span>
                                <h2 className="text-2xl lg:text-3xl font-bold font-heading">
                                    Improve {config.label}
                                </h2>
                            </div>
                            <p className="text-white/80 text-sm lg:text-base max-w-lg">
                                Curated activities, books, videos, and toys to help boost {child.name}'s {config.label.toLowerCase()} development.
                            </p>

                            {/* Status badge */}
                            {domainStatus && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColors(domainStatus)}`}>
                                        {getStatusLabel(domainStatus)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Score ring */}
                        {domainScore > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <ScoreRing score={domainScore} />
                                <span className="text-xs text-white/60 font-medium mt-1">Current Score</span>
                            </div>
                        )}
                    </div>

                    {/* Decorative blobs */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* ── Main Content ────────────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* ─── Left Column: Resources ─────────────────────────── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Tab bar */}
                            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                                                ? 'bg-white text-gray-800 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Regenerate button */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    {loading ? 'Loading resources...' : `${resources.length} resource${resources.length !== 1 ? 's' : ''} found`}
                                </p>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${config.textClass} ${config.bgClass} hover:opacity-80`}
                                >
                                    <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                                    {regenerating ? 'Regenerating...' : 'Regenerate Activities'}
                                </button>
                            </div>

                            {/* Resource list */}
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-gray-200" />
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                                                    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                                                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                                                    <div className="flex gap-2 mt-3">
                                                        <div className="h-6 bg-gray-100 rounded-full w-16" />
                                                        <div className="h-6 bg-gray-100 rounded-full w-14" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : resources.length === 0 ? (
                                <div className="bg-white rounded-[24px] p-12 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-50 text-center">
                                    <div className={`w-16 h-16 ${config.bgClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                        <span className="text-3xl">{config.emoji}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">No resources yet</h4>
                                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                        Generate personalized {activeTab === 'activity' ? 'activities' : activeTab === 'book' ? 'book recommendations' : activeTab === 'video' ? 'video resources' : 'toy recommendations'} to support {child.name}'s {config.label.toLowerCase()} development.
                                    </p>
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={regenerating}
                                        className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2`}
                                    >
                                        {regenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        Generate Resources
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Featured resource */}
                                    {featuredResource && (
                                        <ResourceCard resource={featuredResource} featured />
                                    )}

                                    {/* Other resources */}
                                    {otherResources.map((resource) => (
                                        <ResourceCard key={resource.id} resource={resource} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ─── Right Column: Domain Summary + Quick Tips ──────── */}
                        <div className="space-y-6">

                            {/* Domain Summary Card */}
                            {assessment && (
                                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="text-xl">{config.emoji}</span>
                                        {config.label} Summary
                                    </h3>

                                    {/* Score bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-gray-600 font-medium">Current Score</span>
                                            <span className="font-bold" style={{ color: scoreColor }}>{domainScore}/100</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${domainScore}%`, backgroundColor: scoreColor }}
                                            />
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    {assessment.strengths && assessment.strengths.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Strengths</h4>
                                            <ul className="space-y-1.5">
                                                {assessment.strengths.slice(0, 3).map((s, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Areas to support */}
                                    {assessment.areasToSupport && assessment.areasToSupport.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Focus Areas</h4>
                                            <ul className="space-y-1.5">
                                                {assessment.areasToSupport.slice(0, 3).map((a, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                        {a}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Activities from Analysis */}
                            {assessment?.activities && assessment.activities.length > 0 && (
                                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Sparkles className={`w-5 h-5 ${config.textClass}`} />
                                        Quick Activities
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">From your latest analysis</p>
                                    <div className="space-y-2.5">
                                        {assessment.activities.slice(0, 5).map((act, i) => (
                                            <div key={i} className={`${config.bgClass} rounded-xl px-4 py-3 text-sm text-gray-800`}>
                                                {act}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className={`${config.bgClass} rounded-2xl p-5 border ${config.borderClass}`}>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className={`w-5 h-5 ${config.textClass} shrink-0 mt-0.5`} />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">Remember</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Every child develops at their own pace. These resources are for informational purposes only and do not replace professional medical advice. If you have concerns, consult your pediatrician.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
