import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import {
    FileText,
    Download,
    Share2,
    Mail,
    Loader2,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Sparkles,
    Calendar,
    Baby,
    ArrowLeft,
    X,
    ClipboardList,
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { useAppConfig } from '../hooks/useAppConfig';
import api from '../api';

// --- Types ---

interface ReportListItem {
    id: string;
    childId: string;
    reportNumber?: string;
    generatedAt: string;
    overallScore?: number;
    overallStatus?: string;
    overallSummary?: string;
    domains: {
        id: string;
        label: string;
        score: number;
        status: string;
    }[];
}

interface ReportDetail {
    id: string;
    childId: string;
    reportNumber?: string;
    generatedAt: string;
    overallScore: number;
    overallStatus: string;
    overallSummary?: string;
    patientInfo: {
        name: string;
        age: string;
        gender: string;
        weight?: string;
        height?: string;
    };
    domains: {
        id: string;
        label: string;
        score: number;
        status: string;
        observations: string[];
        recommendations: string[];
    }[];
    recommendations: string[];
    findings: string[];
}

// --- Helpers ---

const DOMAIN_LABELS: Record<string, string> = {
    motor: 'Motor Skills',
    cognitive: 'Cognitive Skills',
    language: 'Language Skills',
    social: 'Social-Emotional',
};

function mapBackendStatus(status: string): string {
    switch (status) {
        case 'on_track': return 'on-track';
        case 'on_track_with_monitoring': return 'on-track-monitoring';
        case 'emerging': return 'monitor';
        case 'needs_support': return 'discuss';
        default: return status;
    }
}

function formatAgeMonths(months: number): string {
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (remaining === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remaining}m`;
}

function mapBackendReportToListItem(raw: any): ReportListItem {
    const id = raw?.id || raw?._id || '';
    const domains: ReportListItem['domains'] = [];

    if (Array.isArray(raw?.domainAssessments)) {
        for (const da of raw.domainAssessments) {
            const domainId = da.domain ?? 'unknown';
            domains.push({
                id: domainId,
                label: DOMAIN_LABELS[domainId] ?? domainId.charAt(0).toUpperCase() + domainId.slice(1),
                score: da.score ?? 0,
                status: mapBackendStatus(da.status ?? ''),
            });
        }
    }

    return {
        id: String(id),
        childId: raw?.childId ?? '',
        reportNumber: raw?.reportNumber,
        generatedAt: raw?.generatedAt ?? raw?.createdAt ?? new Date().toISOString(),
        overallScore: raw?.overallScore,
        overallStatus: raw?.overallStatus ? mapBackendStatus(raw.overallStatus) : undefined,
        overallSummary: raw?.overallSummary,
        domains,
    };
}

function mapBackendReportToDetail(raw: any): ReportDetail {
    const id = raw?.id || raw?._id || '';

    const pi = raw?.patientInfo || {};
    const patientInfo = {
        name: pi.name ?? '',
        age: typeof pi.ageMonths === 'number' ? formatAgeMonths(pi.ageMonths) : (pi.age ?? ''),
        gender: pi.gender ?? '',
        weight: pi.weight != null ? `${pi.weight} kg` : undefined,
        height: pi.height != null ? `${pi.height} cm` : undefined,
    };

    const domains: ReportDetail['domains'] = [];
    if (Array.isArray(raw?.domainAssessments)) {
        for (const da of raw.domainAssessments) {
            const domainId = da.domain ?? 'unknown';
            domains.push({
                id: domainId,
                label: DOMAIN_LABELS[domainId] ?? domainId.charAt(0).toUpperCase() + domainId.slice(1),
                score: da.score ?? 0,
                status: mapBackendStatus(da.status ?? ''),
                observations: [
                    ...(Array.isArray(da.observations) ? da.observations : []),
                    ...(Array.isArray(da.strengths) ? da.strengths.map((s: string) => `Strength: ${s}`) : []),
                ],
                recommendations: Array.isArray(da.areasToSupport) ? da.areasToSupport : [],
            });
        }
    }

    let recommendations: string[] = [];
    if (Array.isArray(raw?.recommendations)) {
        recommendations = raw.recommendations
            .map((r: any) => (typeof r === 'string' ? r : r?.text ?? ''))
            .filter(Boolean);
    }

    const findings: string[] = [];
    if (raw?.overallSummary) findings.push(raw.overallSummary);

    return {
        id: String(id),
        childId: raw?.childId ?? '',
        reportNumber: raw?.reportNumber,
        generatedAt: raw?.generatedAt ?? raw?.createdAt ?? new Date().toISOString(),
        overallScore: raw?.overallScore ?? 0,
        overallStatus: mapBackendStatus(raw?.overallStatus ?? ''),
        overallSummary: raw?.overallSummary,
        patientInfo,
        domains,
        recommendations,
        findings,
    };
}

function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
        ahead: 'bg-emerald-100 text-emerald-700',
        'on-track': 'bg-blue-100 text-blue-700',
        'on-track-monitoring': 'bg-sky-100 text-sky-700',
        monitor: 'bg-amber-100 text-amber-700',
        discuss: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
}

const DEFAULT_SCORE_THRESHOLDS: Record<string, { min: number; color: string }> = {
    excellent: { min: 80, color: 'text-emerald-600' },
    good: { min: 60, color: 'text-blue-600' },
    fair: { min: 40, color: 'text-amber-600' },
    poor: { min: 0, color: 'text-red-600' },
};

const DEFAULT_STATUS_LABELS: Record<string, string> = {
    'on-track': 'On Track',
    'on-track-monitoring': 'On Track (Monitoring)',
    'monitor': 'Monitor',
    'discuss': 'Discuss',
    'ahead': 'Ahead',
};

function getScoreColor(score: number, scoreThresholds?: Record<string, { min: number; color: string }> | null) {
    const thresholds = scoreThresholds || DEFAULT_SCORE_THRESHOLDS;
    const sorted = Object.values(thresholds).sort((a, b) => b.min - a.min);
    for (const t of sorted) {
        if (score >= t.min) return t.color;
    }
    return sorted[sorted.length - 1]?.color || 'text-gray-600';
}

function getStatusLabel(status: string, statuses?: Record<string, { label: string }> | null) {
    if (statuses?.[status]) return statuses[status].label;
    if (DEFAULT_STATUS_LABELS[status]) return DEFAULT_STATUS_LABELS[status];
    return status.charAt(0).toUpperCase() + status.slice(1);
}

// --- Components ---

function ReportListView({
    reports,
    loading,
    generating,
    error,
    onGenerate,
    onSelectReport,
    onRetry,
}: {
    reports: ReportListItem[];
    loading: boolean;
    generating: boolean;
    error: string | null;
    onGenerate: () => void;
    onSelectReport: (id: string) => void;
    onRetry: () => void;
}) {
    const { config } = useAppConfig();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Failed to load reports</h3>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={onRetry}
                        className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Generate button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Pediatrician Reports</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {reports.length > 0
                            ? `${reports.length} report${reports.length !== 1 ? 's' : ''} generated`
                            : 'Generate a report to share with your pediatrician'}
                    </p>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>

            {/* Empty state */}
            {reports.length === 0 && !generating && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ClipboardList className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Reports Yet</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        Generate a comprehensive pediatrician report based on your child's development analyses.
                        Reports include domain scores, observations, and recommendations.
                    </p>
                    <button
                        onClick={onGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                    >
                        <Sparkles className="w-5 h-5" />
                        Generate Your First Report
                    </button>
                </div>
            )}

            {/* Report cards */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {reports.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => onSelectReport(report.id)}
                            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                </div>
                                {report.overallScore != null && (
                                    <span className={`text-2xl font-bold ${getScoreColor(report.overallScore, config?.scoreThresholds)}`}>
                                        {report.overallScore}
                                    </span>
                                )}
                            </div>

                            <h4 className="font-semibold text-gray-800 text-sm mb-1">
                                {report.reportNumber || `Report`}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(report.generatedAt).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                })}
                            </div>

                            {report.overallStatus && (
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(report.overallStatus)} mb-3`}>
                                    {getStatusLabel(report.overallStatus, config?.statuses)}
                                </span>
                            )}

                            {report.domains.length > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    {report.domains.map((d) => (
                                        <div key={d.id} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-20 truncate">{d.label}</span>
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${d.score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 w-7 text-right">{d.score}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReportDetailView({
    reportId,
    childId,
    onBack,
}: {
    reportId: string;
    childId: string;
    onBack: () => void;
}) {
    const { config } = useAppConfig();
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [sharing, setSharing] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    const loadReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/reports/${childId}/${reportId}`);
            const payload = res.data;
            const rawReport = payload?.report || payload;
            setReport(mapBackendReportToDetail(rawReport));
        } catch (err: any) {
            console.error('Failed to load report:', err);
            setError(err?.response?.data?.error || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [childId, reportId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleDownloadPdf = async () => {
        if (!report) return;
        setDownloading(true);
        try {
            const res = await api.get(`/reports/${childId}/${report.id}/pdf`);
            const pdfUrl = res.data?.pdfUrl || res.data?.url;
            if (pdfUrl) {
                window.open(pdfUrl, '_blank');
            }
        } catch (err) {
            console.error('Failed to download PDF:', err);
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!report || !shareEmail.trim()) return;
        setSharing(true);
        setShareSuccess(false);
        try {
            await api.post(`/reports/${childId}/${report.id}/share`, {
                method: 'email',
                recipient: shareEmail.trim(),
            });
            setShareSuccess(true);
            setTimeout(() => {
                setShowShareModal(false);
                setShareEmail('');
                setShareSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Failed to share report:', err);
        } finally {
            setSharing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <h3 className="font-bold text-gray-800 mb-1">Loading Report...</h3>
                    <p className="text-sm text-gray-500">Fetching report details</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">Failed to load report</h3>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onBack} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                            Go Back
                        </button>
                        <button onClick={loadReport} className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="space-y-6">
            {/* Back / actions row */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Report header card */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Pediatrician Report</h2>
                        <p className="text-white/80 text-sm mt-1">{report.reportNumber || `Report #${report.id.slice(0, 8)}`}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{report.overallScore}</div>
                        <span className="text-white/80 text-xs">out of 100</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(report.generatedAt).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                        })}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white`}>
                        {getStatusLabel(report.overallStatus, config?.statuses)}
                    </span>
                </div>
            </div>

            {/* Patient info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Baby className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Patient Information</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="font-medium text-gray-800">{report.patientInfo.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-500 text-xs">Age</p>
                        <p className="font-medium text-gray-800">{report.patientInfo.age}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-500 text-xs">Gender</p>
                        <p className="font-medium text-gray-800 capitalize">{report.patientInfo.gender}</p>
                    </div>
                    {report.patientInfo.weight && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-gray-500 text-xs">Weight</p>
                            <p className="font-medium text-gray-800">{report.patientInfo.weight}</p>
                        </div>
                    )}
                    {report.patientInfo.height && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-gray-500 text-xs">Height</p>
                            <p className="font-medium text-gray-800">{report.patientInfo.height}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Overall summary */}
            {report.overallSummary && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Overall Summary</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{report.overallSummary}</p>
                </div>
            )}

            {/* Domain assessments */}
            {report.domains.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Domain Assessments</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {report.domains.map((domain) => (
                            <div key={domain.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-gray-800">{domain.label}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${getScoreColor(domain.score, config?.scoreThresholds)}`}>
                                            {domain.score}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(domain.status)}`}>
                                            {getStatusLabel(domain.status, config?.statuses)}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${domain.score}%` }}
                                    />
                                </div>

                                {domain.observations.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Observations</p>
                                        <ul className="space-y-1.5">
                                            {domain.observations.map((obs, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    {obs}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {domain.recommendations.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Areas to Support</p>
                                        <ul className="space-y-1.5">
                                            {domain.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <TrendingUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* General recommendations */}
            {report.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Recommendations</h3>
                    <div className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                {rec}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center gap-3 pb-6">
                <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                    {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download PDF
                </button>
                <button
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
                >
                    <Share2 className="w-5 h-5" />
                    Share Report
                </button>
            </div>

            {/* Share modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-800">Share Report</h3>
                            <button onClick={() => setShowShareModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {shareSuccess ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="font-semibold text-gray-800">Report shared successfully!</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-4">
                                    Enter the email address to share this report with your pediatrician.
                                </p>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                                        <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                                        <input
                                            type="email"
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            placeholder="doctor@example.com"
                                            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleShare}
                                    disabled={sharing || !shareEmail.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {sharing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sharing...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Send via Email
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Page ---

export default function Reports() {
    const { activeChild } = useChild();
    const [reports, setReports] = useState<ReportListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    const childId = activeChild?._id;

    const fetchReports = useCallback(async () => {
        if (!childId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/reports/${childId}`);
            const payload = res.data;
            const rawReports = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.reports)
                    ? payload.reports
                    : [];
            setReports(rawReports.map(mapBackendReportToListItem));
        } catch (err: any) {
            console.error('Failed to fetch reports:', err);
            setError(err?.response?.data?.error || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    }, [childId]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleGenerate = async () => {
        if (!childId) return;
        setGenerating(true);
        try {
            const res = await api.post(`/reports/${childId}/generate`);
            const payload = res.data;
            const rawReport = payload?.report || payload;
            const newReport = mapBackendReportToListItem(rawReport);
            setReports((prev) => [newReport, ...prev]);
            // Navigate to the new report detail
            setSelectedReportId(newReport.id);
        } catch (err: any) {
            console.error('Failed to generate report:', err);
            setError(err?.response?.data?.error || 'Failed to generate report. Make sure you have run a development analysis first.');
        } finally {
            setGenerating(false);
        }
    };

    if (!childId) {
        return (
            <div className="flex-1 flex flex-col min-h-0">
                <TopBar title="Reports" subtitle="Pediatrician reports" />
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Baby className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-800 mb-2">No Child Selected</h3>
                            <p className="text-sm text-gray-500">Please select a child profile to view reports.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <TopBar
                title="Reports"
                subtitle={selectedReportId ? 'Report details' : 'Pediatrician reports'}
            />
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {selectedReportId ? (
                        <ReportDetailView
                            reportId={selectedReportId}
                            childId={childId}
                            onBack={() => {
                                setSelectedReportId(null);
                                fetchReports();
                            }}
                        />
                    ) : (
                        <ReportListView
                            reports={reports}
                            loading={loading}
                            generating={generating}
                            error={error}
                            onGenerate={handleGenerate}
                            onSelectReport={setSelectedReportId}
                            onRetry={fetchReports}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
