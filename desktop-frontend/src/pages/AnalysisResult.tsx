import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import {
    Share2,
    Download,
    Printer,
    Brain,
    MessageCircle,
    Activity,
    HeartHandshake,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    BookOpen,
    ExternalLink,
    Scale,
    Ruler,
    TrendingUp,
    Info,
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../api';
import { useAppConfig } from '../hooks/useAppConfig';

// --- Types ---

interface DomainAssessment {
    domain: string;
    score: number;
    status: string;
    observations: string[];
    strengths: string[];
    areasToSupport: string[];
    achievedMilestones: { id: string; title: string; achievedDate: string }[];
    upcomingMilestones: { id: string; title: string; typicalMonths: number }[];
    activities: string[];
}

interface GrowthPercentile {
    metric: string;
    value: number;
    percentile: number;
    interpretation: string;
}

interface Source {
    title: string;
    url: string;
    type: string;
}

interface AnalysisData {
    _id?: string;
    overallScore: number;
    overallStatus: string;
    summary: string;
    motorAssessment: DomainAssessment;
    languageAssessment: DomainAssessment;
    cognitiveAssessment: DomainAssessment;
    socialAssessment: DomainAssessment;
    growthPercentiles: GrowthPercentile[];
    personalizedTips: string[];
    sources: Source[];
    childAgeAtAnalysis: number;
    createdAt: string;
}

// --- Helpers ---

// Config-driven helpers that accept the config object
function getStatusLabelFromConfig(status: string, statuses?: Record<string, any>): string {
    if (statuses?.[status]) return statuses[status].label;
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Color mapping from hex config to tailwind classes (used for status badges)
function hexToStatusClasses(color?: string, _bgColor?: string) {
    // Map known config colors to tailwind classes
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        '#10b981': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        '#059669': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        '#0ea5e9': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
        '#f59e0b': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
        '#ef4444': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    };
    return colorMap[color || ''] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
}

function hexToOverallStatusClasses(color?: string) {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        '#10b981': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        '#059669': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        '#0ea5e9': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
        '#f59e0b': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        '#ef4444': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return colorMap[color || ''] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
}

function getScoreColorFromConfig(score: number, scoreThresholds?: Record<string, any>): string {
    if (scoreThresholds) {
        if (score >= (scoreThresholds.excellent?.min ?? 70)) return scoreThresholds.excellent?.color ?? '#10b981';
        if (score >= (scoreThresholds.moderate?.min ?? 50)) return scoreThresholds.moderate?.color ?? '#f59e0b';
        return scoreThresholds.concern?.color ?? '#ef4444';
    }
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
}

const getSourceOrgColor = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'guideline': return 'bg-blue-100 text-blue-600';
        case 'data': return 'bg-green-100 text-green-600';
        case 'research': return 'bg-purple-100 text-purple-600';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const getPercentileColor = (percentile: number) => {
    if (percentile >= 50) return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' };
    if (percentile >= 25) return { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' };
    return { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' };
};

// Icon mapping for domain keys
const DOMAIN_ICON_MAP: Record<string, React.ComponentType<any>> = {
    motor: Activity,
    cognitive: Brain,
    language: MessageCircle,
    social: HeartHandshake,
};

// Tailwind class mappings for domain colors (derived from hex)
const DOMAIN_TW_MAP: Record<string, { color: string; lightBg: string; textColor: string }> = {
    '#3b82f6': { color: 'bg-blue-500', lightBg: 'bg-blue-100', textColor: 'text-blue-600' },
    '#8b5cf6': { color: 'bg-purple-500', lightBg: 'bg-purple-100', textColor: 'text-purple-600' },
    '#ec4899': { color: 'bg-pink-500', lightBg: 'bg-pink-100', textColor: 'text-pink-600' },
    '#f59e0b': { color: 'bg-amber-500', lightBg: 'bg-amber-100', textColor: 'text-amber-600' },
    '#10b981': { color: 'bg-emerald-500', lightBg: 'bg-emerald-100', textColor: 'text-emerald-600' },
    '#06b6d4': { color: 'bg-cyan-500', lightBg: 'bg-cyan-100', textColor: 'text-cyan-600' },
};

// Fallback domain config used when the API config is not yet loaded
const FALLBACK_DOMAIN_CONFIG = [
    { key: 'motorAssessment', name: 'Motor Skills', color: 'bg-blue-500', lightBg: 'bg-blue-100', textColor: 'text-blue-600', icon: Activity },
    { key: 'cognitiveAssessment', name: 'Cognitive Skills', color: 'bg-purple-500', lightBg: 'bg-purple-100', textColor: 'text-purple-600', icon: Brain },
    { key: 'languageAssessment', name: 'Language Skills', color: 'bg-pink-500', lightBg: 'bg-pink-100', textColor: 'text-pink-600', icon: MessageCircle },
    { key: 'socialAssessment', name: 'Social-Emotional', color: 'bg-amber-500', lightBg: 'bg-amber-100', textColor: 'text-amber-600', icon: HeartHandshake },
];

// --- Components ---

function DomainCard({
    domain,
    config,
    isExpanded,
    onToggle,
    onImprove,
    statuses,
    scoreThresholds,
}: {
    domain: DomainAssessment;
    config: { key: string; name: string; color: string; lightBg: string; textColor: string; icon: React.ComponentType<any> };
    isExpanded: boolean;
    onToggle: () => void;
    onImprove: () => void;
    statuses?: Record<string, any>;
    scoreThresholds?: Record<string, any>;
}) {
    const statusCfg = statuses?.[domain.status];
    const statusColors = statusCfg ? hexToStatusClasses(statusCfg.color) : hexToStatusClasses();
    const Icon = config.icon;
    const scoreColor = getScoreColorFromConfig(domain.score, scoreThresholds);

    return (
        <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border overflow-hidden transition-all ${statusColors.border}`}>
            <button
                onClick={onToggle}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.lightBg} ${config.textColor} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900">{config.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
                                {getStatusLabelFromConfig(domain.status, statuses)}
                            </span>
                            <span className="text-sm text-gray-500">Score: {domain.score}/100</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Mini progress ring */}
                    <div className="w-12 h-12 relative">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r="14" fill="none"
                                stroke={scoreColor}
                                strokeWidth="3"
                                strokeDasharray={`${(domain.score / 100) * 88} 88`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">{domain.score}</span>
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                    {/* Progress bar full width */}
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${domain.score}%`, backgroundColor: scoreColor }}
                        />
                    </div>

                    {/* Observations */}
                    {domain.observations && domain.observations.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Observations</h4>
                            <ul className="space-y-2">
                                {domain.observations.map((obs, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        {obs}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Strengths */}
                    {domain.strengths && domain.strengths.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Strengths</h4>
                            <ul className="space-y-2">
                                {domain.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Areas to Support / Recommendations */}
                    {domain.areasToSupport && domain.areasToSupport.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Recommendations</h4>
                            <ul className="space-y-2">
                                {domain.areasToSupport.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Activities */}
                    {domain.activities && domain.activities.length > 0 && (
                        <div className="bg-blue-50/50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Suggested Activities</h4>
                            <ul className="space-y-2">
                                {domain.activities.map((act, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <Activity className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        {act}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onImprove();
                        }}
                        className="w-full mt-3 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                    >
                        Improve {config.name} →
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Main Page ---

export default function AnalysisResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const { activeChild } = useChild();
    const { config } = useAppConfig();
    const [analysis, setAnalysis] = useState<AnalysisData | null>(location.state?.analysis || null);
    const [loading, setLoading] = useState(!analysis);
    const [expandedDomain, setExpandedDomain] = useState<string | null>('motorAssessment');
    const [showAllSources, setShowAllSources] = useState(false);

    const child = activeChild;

    // Build domain config from API config, falling back to hardcoded
    const domainConfig = config?.domains
        ? Object.values(config.domains)
            .filter(d => d.assessmentKey) // only domains with assessment keys
            .map(d => {
                const tw = DOMAIN_TW_MAP[d.color] || { color: 'bg-gray-500', lightBg: 'bg-gray-100', textColor: 'text-gray-600' };
                return {
                    key: d.assessmentKey,
                    name: d.label,
                    color: tw.color,
                    lightBg: tw.lightBg,
                    textColor: tw.textColor,
                    icon: DOMAIN_ICON_MAP[d.key] || Activity,
                };
            })
            .filter(d => ['motorAssessment', 'cognitiveAssessment', 'languageAssessment', 'socialAssessment'].includes(d.key))
        : FALLBACK_DOMAIN_CONFIG;

    const getStatusLabel = (status: string) => getStatusLabelFromConfig(status, config?.statuses);
    const getOverallStatusColors = (status: string) => {
        const statusCfg = config?.statuses?.[status];
        return statusCfg ? hexToOverallStatusClasses(statusCfg.color) : hexToOverallStatusClasses();
    };

    useEffect(() => {
        if (!analysis && child?._id) {
            fetchLatestAnalysis();
        }
    }, [child?._id]);

    const fetchLatestAnalysis = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/analysis/${child!._id}`);
            const analyses = response.data.analyses || [];
            if (analyses.length > 0) {
                setAnalysis(analyses[0]);
            }
        } catch (error) {
            console.error('Failed to fetch analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Action handlers ---

    const handlePrintReport = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // Open print dialog which allows saving as PDF
        window.print();
        toast.success('Use "Save as PDF" in the print dialog to download.');
    };

    const handleShareWithPediatrician = () => {
        toast.info('Share with Pediatrician is coming soon! For now, use "Print Report" to generate a document.', {
            autoClose: 5000,
        });
    };

    const handleShareReport = async () => {
        if (!analysis || !child) return;
        const shareText = `${child.name}'s Development Report\nOverall Score: ${analysis.overallScore}/100\n${analysis.summary}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${child.name}'s Development Report`,
                    text: shareText,
                    url: window.location.href,
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            toast.success('Report summary copied to clipboard!');
        }
    };

    // --- Loading / Empty states ---

    if (loading) {
        return (
            <>
                <TopBar title="Analysis Results" subtitle="Loading..." />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            </>
        );
    }

    if (!analysis) {
        return (
            <>
                <TopBar title="Analysis Results" subtitle="No analysis found" />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                    <p className="text-gray-500">No analysis data available.</p>
                    <button onClick={() => navigate('/analysis')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition">
                        Run Analysis
                    </button>
                </div>
            </>
        );
    }

    // --- Extract data from analysis with proper field paths ---

    const overallScore = analysis.overallScore || 0;
    const overallStatus = analysis.overallStatus || 'on_track';
    const summary = analysis.summary || '';
    const analysisDate = analysis.createdAt || new Date().toISOString();
    const childName = child?.name || 'Child';
    const childAge = analysis.childAgeAtAnalysis;

    const motorAssessment = analysis.motorAssessment || { domain: 'motor', score: 0, status: 'on_track', observations: [], strengths: [], areasToSupport: [], achievedMilestones: [], upcomingMilestones: [], activities: [] };
    const cognitiveAssessment = analysis.cognitiveAssessment || { domain: 'cognitive', score: 0, status: 'on_track', observations: [], strengths: [], areasToSupport: [], achievedMilestones: [], upcomingMilestones: [], activities: [] };
    const languageAssessment = analysis.languageAssessment || { domain: 'language', score: 0, status: 'on_track', observations: [], strengths: [], areasToSupport: [], achievedMilestones: [], upcomingMilestones: [], activities: [] };
    const socialAssessment = analysis.socialAssessment || { domain: 'social', score: 0, status: 'on_track', observations: [], strengths: [], areasToSupport: [], achievedMilestones: [], upcomingMilestones: [], activities: [] };

    const assessments: Record<string, DomainAssessment> = {
        motorAssessment,
        cognitiveAssessment,
        languageAssessment,
        socialAssessment,
    };

    const growthPercentiles = analysis.growthPercentiles || [];
    const personalizedTips = analysis.personalizedTips || [];
    const sources = analysis.sources || [];

    // Detect any domain that needs support to show as a "warning"
    const warnings: { severity: string; domain: string; message: string }[] = [];
    for (const cfg of domainConfig) {
        const assessment = assessments[cfg.key];
        if (assessment?.status === 'needs_support') {
            warnings.push({
                severity: 'discuss',
                domain: cfg.name,
                message: `${cfg.name}: This area may benefit from additional support. Consider discussing with your pediatrician.`,
            });
        } else if (assessment?.status === 'on_track_with_monitoring') {
            warnings.push({
                severity: 'monitor',
                domain: cfg.name,
                message: `${cfg.name}: On track but worth monitoring. Continue current activities and watch for progress.`,
            });
        } else if (assessment?.status === 'emerging') {
            warnings.push({
                severity: 'monitor',
                domain: cfg.name,
                message: `${cfg.name}: Development is emerging. Continue focused activities and monitor progress.`,
            });
        }
    }

    const overallStatusColors = getOverallStatusColors(overallStatus);

    return (
        <>
            <TopBar
                title="Analysis Results"
                subtitle={`${childName}'s development assessment - ${format(new Date(analysisDate), 'MMM d, yyyy')}`}
            />
            <div className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col gap-6 print:p-4">

                {/* Back button */}
                <button onClick={() => navigate('/analysis')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition w-max print:hidden">
                    <ChevronLeft className="w-5 h-5" /> Back to Analysis
                </button>

                {/* ====== Banner with headline & score ====== */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[28px] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg relative overflow-hidden">
                    <div className="z-10 flex-1">
                        <p className="text-emerald-100 font-medium mb-1 text-sm md:text-base">Overall Development Score</p>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl md:text-6xl font-bold font-heading">{overallScore}</span>
                            <span className="text-emerald-100 text-xl md:text-2xl font-semibold mb-1 md:mb-2">/100</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${overallStatusColors.bg} ${overallStatusColors.text}`}>
                                {getStatusLabel(overallStatus)}
                            </span>
                            {childAge && (
                                <span className="text-emerald-100 text-sm">at {childAge} months</span>
                            )}
                        </div>
                        {/* Headline / Reassurance from summary */}
                        {summary && (
                            <p className="font-medium text-emerald-50 leading-relaxed max-w-xl">{summary}</p>
                        )}
                    </div>
                    <div className="z-10 mt-6 md:mt-0 flex flex-col items-end gap-4 w-full md:w-auto shrink-0">
                        <span className="text-emerald-100 text-sm font-medium pr-1">{format(new Date(analysisDate), 'MMM d, yyyy')}</span>
                        <button
                            onClick={handleShareReport}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition text-white px-5 py-2.5 rounded-full font-semibold backdrop-blur-sm self-start md:self-auto print:hidden"
                        >
                            <Share2 className="w-4 h-4" /> Share Report
                        </button>
                    </div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute right-40 -bottom-20 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* ====== Warnings Panel ====== */}
                {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-amber-700 mb-3">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="font-bold">Points to Consider</h3>
                        </div>
                        <div className="space-y-3">
                            {warnings.map((warning, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${
                                        warning.severity === 'urgent' ? 'bg-red-100 text-red-700' :
                                        warning.severity === 'discuss' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {warning.severity}
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{warning.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8 pb-8">

                    {/* ====== Left Column ====== */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Domain Breakdown - Expandable Cards */}
                        <div>
                            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4 px-1">Domain Breakdown</h3>
                            <div className="flex flex-col gap-4">
                                {domainConfig.map((cfg) => (
                                    <DomainCard
                                        key={cfg.key}
                                        domain={assessments[cfg.key]}
                                        config={cfg}
                                        isExpanded={expandedDomain === cfg.key}
                                        onToggle={() => setExpandedDomain(expandedDomain === cfg.key ? null : cfg.key)}
                                        onImprove={() => navigate(`/improve-domain?domain=${cfg.key.replace('Assessment', '')}`)}
                                        statuses={config?.statuses}
                                        scoreThresholds={config?.scoreThresholds}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ====== Physical Growth Percentiles ====== */}
                        {growthPercentiles.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Physical Growth (WHO Percentiles)
                                </h3>
                                <div className={`grid gap-4 ${growthPercentiles.length >= 3 ? 'grid-cols-3' : growthPercentiles.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {growthPercentiles.map((gp, i) => {
                                        const colors = getPercentileColor(gp.percentile);
                                        const metricIcon = gp.metric === 'weight'
                                            ? <Scale className={`w-6 h-6 ${colors.icon} mx-auto mb-2`} />
                                            : gp.metric === 'height'
                                            ? <Ruler className={`w-6 h-6 ${colors.icon} mx-auto mb-2`} />
                                            : <Info className={`w-6 h-6 ${colors.icon} mx-auto mb-2`} />;
                                        const metricLabel = gp.metric === 'weight' ? 'Weight'
                                            : gp.metric === 'height' ? 'Height'
                                            : gp.metric === 'headCircumference' ? 'Head Circ.'
                                            : gp.metric;

                                        return (
                                            <div key={i} className={`p-4 ${colors.bg} rounded-xl text-center`}>
                                                {metricIcon}
                                                <p className={`text-2xl font-bold ${colors.text}`}>{gp.percentile}%</p>
                                                <p className="text-sm text-gray-600 font-medium">{metricLabel}</p>
                                                {gp.value > 0 && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {gp.value} {gp.metric === 'weight' ? 'kg' : 'cm'}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {growthPercentiles.some(gp => gp.interpretation) && (
                                    <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                                        {growthPercentiles.find(gp => gp.interpretation)?.interpretation}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ====== Development Tips ====== */}
                        {personalizedTips.length > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    Development Tips for {childName}
                                </h3>
                                <div className="space-y-4">
                                    {personalizedTips.slice(0, 8).map((tip, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold shadow-sm flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="pt-1">
                                                <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ====== Right Column ====== */}
                    <div className="flex flex-col gap-6">

                        {/* Summary Card */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
                            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Summary</h3>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                {summary || `${childName} shows overall development at the ${overallScore}th percentile. Continue providing stimulating activities across all developmental domains.`}
                            </p>
                            {childAge && (
                                <p className="text-xs text-gray-400 mt-3">
                                    Assessment performed at {childAge} month{childAge !== 1 ? 's' : ''} of age, based on WHO developmental milestones.
                                </p>
                            )}
                        </div>

                        {/* Score Overview */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
                            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Score Overview</h3>
                            <div className="space-y-3">
                                {domainConfig.map((cfg) => {
                                    const assessment = assessments[cfg.key];
                                    return (
                                        <div key={cfg.key}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 font-medium">{cfg.name}</span>
                                                <span className={`font-bold ${cfg.textColor}`}>{assessment.score}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${cfg.color} rounded-full transition-all duration-700`}
                                                    style={{ width: `${assessment.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ====== WHO Research Sources ====== */}
                        {sources.length > 0 && (
                            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        Research Sources
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                                        {sources.length} source{sources.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {(showAllSources ? sources : sources.slice(0, 3)).map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getSourceOrgColor(source.type)}`}>
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                                                    {source.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {source.type && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${getSourceOrgColor(source.type)}`}>
                                                            {source.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1 group-hover:text-blue-500" />
                                        </a>
                                    ))}
                                </div>
                                {sources.length > 3 && (
                                    <button
                                        onClick={() => setShowAllSources(!showAllSources)}
                                        className="w-full mt-3 py-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                                    >
                                        {showAllSources ? 'Show Less' : `Show ${sources.length - 3} More Source${sources.length - 3 !== 1 ? 's' : ''}`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ====== Export & Share ====== */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 print:hidden">
                            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Export & Share</h3>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Download PDF Report
                                </button>
                                <button
                                    onClick={handleShareWithPediatrician}
                                    className="w-full flex justify-center items-center gap-2 bg-white text-emerald-600 border-2 border-emerald-500 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition shadow-sm"
                                >
                                    <Share2 className="w-4 h-4" /> Share with Pediatrician
                                </button>
                                <button
                                    onClick={handlePrintReport}
                                    className="w-full flex justify-center items-center gap-2 bg-gray-50 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-100 transition shadow-sm mt-1"
                                >
                                    <Printer className="w-4 h-4" /> Print Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== Disclaimer ====== */}
                <p className="text-center text-xs text-gray-400 pb-4">
                    TinySteps AI provides insights based on WHO developmental guidelines for informational purposes only.
                    It is not a substitute for professional medical advice, diagnosis, or treatment.
                </p>
            </div>
        </>
    );
}
