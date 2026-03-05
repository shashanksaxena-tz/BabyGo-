import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Download,
  FileText,
  Calendar,
  Baby,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  ExternalLink,
  Copy,
  Mail,
} from 'lucide-react';
import { ChildProfile } from '../types';
import { statusBadgeClasses, getScoreColor, getStatusLabel } from '../utils/statusHelpers';
import apiService from '../services/apiService';

interface GeneratedReportViewProps {
  childId: string;
  child?: ChildProfile;
  reportId?: string;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

interface ReportData {
  id: string;
  childId: string;
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

// Default domain labels - will be overridden by /api/config data when available
let _domainLabels: Record<string, string> = {
  motor: 'Motor Skills',
  cognitive: 'Cognitive Skills',
  language: 'Language Skills',
  social: 'Social-Emotional',
};

// Default status mapping - will be overridden by /api/config data when available
let _statusMapping: Record<string, string> = {
  on_track: 'on-track',
  emerging: 'monitor',
  needs_support: 'discuss',
};

// Fetch config once on module load (cached)
let _configLoaded = false;
function loadConfigIfNeeded() {
  if (_configLoaded) return;
  _configLoaded = true;
  apiService.getAppConfig().then((result) => {
    const data = (result as any).data;
    if (data?.domainLabels) _domainLabels = { ..._domainLabels, ...data.domainLabels };
    if (data?.statusMapping) _statusMapping = { ..._statusMapping, ...data.statusMapping };
  }).catch(() => {});
}

// Eagerly load config on module initialization
loadConfigIfNeeded();

function getDomainLabel(domainId: string): string {
  return _domainLabels[domainId] ?? domainId.charAt(0).toUpperCase() + domainId.slice(1);
}

/**
 * Maps backend status values to frontend display values.
 * Uses config from /api/config when available, falls back to defaults.
 */
function mapBackendStatus(status: string): string {
  return _statusMapping[status] ?? status;
}

/** Formats age in months to a human-readable string. */
function formatAgeMonths(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years}y ${remaining}m`;
}

/**
 * Maps a raw backend report object to the frontend ReportData interface.
 *
 * Backend format differences handled:
 *  - _id → id
 *  - patientInfo.ageMonths (number) → patientInfo.age (string)
 *  - patientInfo.weight/height (number) → string with units
 *  - domainAssessments array → domains array with id, label, mapped status,
 *    and areasToSupport merged into recommendations
 *  - recommendations array of { priority, text, domain } → string[]
 *  - overallStatus underscore format → hyphenated
 *  - overallSummary → findings array
 */
function mapBackendReportToData(raw: any): ReportData {
  const id = raw?.id || raw?._id || '';

  // Map patient info — backend has numeric values
  const pi = raw?.patientInfo || {};
  const patientInfo = {
    name: pi.name ?? '',
    age: typeof pi.ageMonths === 'number' ? formatAgeMonths(pi.ageMonths) : (pi.age ?? ''),
    gender: pi.gender ?? '',
    weight: pi.weight != null ? `${pi.weight} kg` : undefined,
    height: pi.height != null ? `${pi.height} cm` : undefined,
  };

  // Map domain assessments array to the expected domains format
  const domains: ReportData['domains'] = [];
  if (Array.isArray(raw?.domainAssessments)) {
    for (const da of raw.domainAssessments) {
      const domainId = da.domain ?? 'unknown';
      domains.push({
        id: domainId,
        label: getDomainLabel(domainId),
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

  // Map recommendations — backend has { priority, text, domain }
  let recommendations: string[] = [];
  if (Array.isArray(raw?.recommendations)) {
    recommendations = raw.recommendations.map((r: any) =>
      typeof r === 'string' ? r : r?.text ?? ''
    ).filter(Boolean);
  }

  // Build findings from overallSummary
  const findings: string[] = [];
  if (raw?.overallSummary) {
    findings.push(raw.overallSummary);
  }

  return {
    id: String(id),
    childId: raw?.childId ?? '',
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

const GeneratedReportView: React.FC<GeneratedReportViewProps> = ({
  childId,
  child,
  reportId,
  onBack,
  onNavigate,
}) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadReport();
  }, [childId, reportId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (reportId) {
        result = await apiService.getReport(childId, reportId);
      } else {
        result = await apiService.generateReport(childId);
      }

      if (result.data) {
        // Backend wraps response as { report: {...} } or { reports: [...] }
        // The apiService.request puts the whole JSON body into result.data
        const payload = result.data as any;
        let rawReport: any = null;

        if (payload?.report) {
          // Single report response: { report: {...} }
          rawReport = payload.report;
        } else if (Array.isArray(payload?.reports) && payload.reports.length > 0) {
          // List response: { reports: [...] }
          rawReport = payload.reports[0];
        } else if (payload?._id || payload?.reportNumber) {
          // Direct report object (unlikely but handled)
          rawReport = payload;
        }

        if (rawReport) {
          setReport(mapBackendReportToData(rawReport));
        } else {
          setError('Report data is empty or in an unexpected format.');
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to load/generate report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    try {
      const result = await apiService.getReportPdf(childId, report.id);
      const pdfPayload = result.data as any;
      const pdfUrl = pdfPayload?.pdfUrl || pdfPayload?.url;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  const handleShare = async (method: string) => {
    if (!report) return;
    setSharing(true);
    try {
      await apiService.shareReport(childId, report.id, method);
      setShowShareMenu(false);
    } catch (err) {
      console.error('Failed to share report:', err);
    } finally {
      setSharing(false);
    }
  };

  const getStatusBadge = statusBadgeClasses;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {reportId ? 'Loading Report...' : 'Generating Report...'}
          </h2>
          <p className="text-sm text-gray-500">
            {reportId
              ? 'Fetching your report data'
              : 'Creating a comprehensive pediatrician report'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Report Generation Failed</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Go Back
            </button>
            <button
              onClick={loadReport}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Generated Report</h1>
            <p className="text-white/80 text-sm">Pediatrician-ready format</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareMenu(true)}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportPdf}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Meta */}
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(report.generatedAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            ID: {report.id?.slice(0, 8) ?? ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 pb-24">
        {/* Patient Info */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Baby className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-bold text-gray-800">Patient Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Name</p>
              <p className="font-medium text-gray-800">{report.patientInfo?.name ?? ''}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Age</p>
              <p className="font-medium text-gray-800">{report.patientInfo?.age ?? ''}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">Gender</p>
              <p className="font-medium text-gray-800 capitalize">{report.patientInfo?.gender ?? ''}</p>
            </div>
            {report.patientInfo?.weight && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500 text-xs">Weight</p>
                <p className="font-medium text-gray-800">{report.patientInfo.weight}</p>
              </div>
            )}
            {report.patientInfo?.height && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500 text-xs">Height</p>
                <p className="font-medium text-gray-800">{report.patientInfo.height}</p>
              </div>
            )}
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Overall Assessment</h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}
              </div>
              <span className="text-xs text-gray-500">out of 100</span>
            </div>
            <div className="flex-1">
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge(report.overallStatus)}`}>
                {getStatusLabel(report.overallStatus)}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                {report.overallSummary || 'Development is being tracked across motor, cognitive, language, and social-emotional domains.'}
              </p>
            </div>
          </div>
        </div>

        {/* Domain Assessment Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-lg">Domain Assessment Details</h3>
          {(report.domains ?? []).map((domain) => (
            <div key={domain.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{domain.label}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(domain.score)}`}>
                    {domain.score}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(domain.status)}`}>
                    {domain.status}
                  </span>
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${domain.score}%` }}
                />
              </div>

              {(domain.observations?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Observations</p>
                  <ul className="space-y-1.5">
                    {(domain.observations ?? []).map((obs, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(domain.recommendations?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</p>
                  <ul className="space-y-1.5">
                    {(domain.recommendations ?? []).map((rec, i) => (
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

        {/* General Recommendations */}
        {(report.recommendations?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4">Recommendations</h3>
            <div className="space-y-2">
              {(report.recommendations ?? []).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-teal-50 rounded-xl text-sm text-teal-800">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export PDF Button */}
        <button
          onClick={handleExportPdf}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareMenu(false)}
          />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Share Report</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleShare('email')}
                disabled={sharing}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Send via Email</span>
              </button>
              <button
                onClick={() => handleShare('link')}
                disabled={sharing}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Copy Link</span>
              </button>
              <button
                onClick={() => handleShare('download')}
                disabled={sharing}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Download PDF</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full mt-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedReportView;
