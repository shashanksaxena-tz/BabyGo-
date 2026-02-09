import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  Calendar,
  Baby,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ChildProfile, AnalysisResult } from '../types';
import { getAnalyses, fetchAnalyses } from '../services/storageService';
import apiService from '../services/apiService';

interface PediatricianReportViewProps {
  childId: string;
  child?: ChildProfile;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

interface Report {
  id: string;
  childId: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'expired';
  overallScore?: number;
  reportNumber?: string;
  domains?: {
    motor: { score: number; status: string };
    cognitive: { score: number; status: string };
    language: { score: number; status: string };
    social: { score: number; status: string };
  };
  findings?: string[];
}

/**
 * Maps backend status values (on_track, emerging, needs_support) to
 * frontend display values (on-track, monitor, discuss).
 */
function mapBackendStatus(status: string): string {
  switch (status) {
    case 'on_track': return 'on-track';
    case 'emerging': return 'monitor';
    case 'needs_support': return 'discuss';
    default: return status;
  }
}

/**
 * Maps a backend report object to the frontend Report interface.
 * Handles _id → id, missing status field, and domainAssessments array → domains object.
 */
function mapBackendReport(raw: any): Report {
  const id = raw.id || raw._id || '';
  const domains: Report['domains'] = { motor: { score: 0, status: 'monitor' }, cognitive: { score: 0, status: 'monitor' }, language: { score: 0, status: 'monitor' }, social: { score: 0, status: 'monitor' } };

  if (Array.isArray(raw.domainAssessments)) {
    for (const da of raw.domainAssessments) {
      const key = da.domain as keyof NonNullable<Report['domains']>;
      if (domains[key]) {
        domains[key] = { score: da.score ?? 0, status: mapBackendStatus(da.status ?? '') };
      }
    }
  }

  return {
    id: String(id),
    childId: raw.childId ?? '',
    generatedAt: raw.generatedAt ?? raw.createdAt ?? new Date().toISOString(),
    status: 'ready', // backend reports are always generated / ready
    overallScore: raw.overallScore,
    reportNumber: raw.reportNumber,
    domains,
    findings: raw.overallSummary ? [raw.overallSummary] : [],
  };
}

const PediatricianReportView: React.FC<PediatricianReportViewProps> = ({
  childId,
  child,
  onBack,
  onNavigate,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load latest analysis - try API first, fall back to localStorage
      const analyses = await fetchAnalyses(childId);
      if (analyses.length > 0) {
        setLatestAnalysis(analyses[0]);
      }

      // Fetch reports from API
      // Backend returns { reports: [...] }, which gets wrapped as result.data = { reports: [...] }
      const result = await apiService.getReports(childId);
      const reportsPayload = result.data as any;
      const rawReports = Array.isArray(reportsPayload)
        ? reportsPayload
        : Array.isArray(reportsPayload?.reports)
          ? reportsPayload.reports
          : [];
      setReports(rawReports.map(mapBackendReport));
    } catch (err) {
      console.error('Failed to load data:', err);
      // Fall back to localStorage for analyses
      const localAnalyses = getAnalyses(childId);
      if (localAnalyses.length > 0) {
        setLatestAnalysis(localAnalyses[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    onNavigate('GENERATED_REPORT', { childId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'text-emerald-600 bg-emerald-50';
      case 'on-track': return 'text-blue-600 bg-blue-50';
      case 'monitor': return 'text-amber-600 bg-amber-50';
      case 'discuss': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (remaining === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remaining}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Pediatrician Report</h1>
            <p className="text-white/80 text-sm">Share with your doctor</p>
          </div>
          <FileText className="w-8 h-8 ml-auto opacity-60" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Report Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Report Status</h3>
                  <p className="text-sm text-gray-500">
                    {reports.length > 0
                      ? `Last generated: ${new Date(reports[0].generatedAt).toLocaleDateString()}`
                      : 'No reports generated yet'}
                  </p>
                </div>
              </div>
              {reports.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-700 font-medium">
                    {reports[0].status === 'ready' ? 'Ready to share' : 'Processing...'}
                  </span>
                </div>
              )}
            </div>

            {/* Child Info Card */}
            {child && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Baby className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{child.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatAge(child.ageMonths)} old | {child.gender}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Report Button */}
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate New Report
                </>
              )}
            </button>

            {/* Development Summary */}
            {latestAnalysis && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Development Summary</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                      <span className="text-3xl font-bold text-emerald-600">{latestAnalysis.overallScore}</span>
                    </div>
                    <span className="text-xs text-gray-500">Overall</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Motor', score: latestAnalysis.motorSkills?.score ?? 0, status: latestAnalysis.motorSkills?.status ?? 'emerging' },
                      { label: 'Cognitive', score: latestAnalysis.cognitiveSkills?.score ?? 0, status: latestAnalysis.cognitiveSkills?.status ?? 'emerging' },
                      { label: 'Language', score: latestAnalysis.languageSkills?.score ?? 0, status: latestAnalysis.languageSkills?.status ?? 'emerging' },
                      { label: 'Social', score: latestAnalysis.socialEmotional?.score ?? 0, status: latestAnalysis.socialEmotional?.status ?? 'emerging' },
                    ].map((domain) => (
                      <div key={domain.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{domain.label}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(domain.status)}`}>
                            {domain.status}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${domain.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Key Findings */}
            {latestAnalysis && latestAnalysis.warnings && latestAnalysis.warnings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Key Findings
                </h3>
                <div className="space-y-3">
                  {latestAnalysis.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl text-sm ${
                        warning.severity === 'urgent'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : warning.severity === 'discuss'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <p className="font-medium">{warning.message}</p>
                      <p className="text-xs mt-1 opacity-80">{warning.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Find Specialists */}
            <button
              onClick={() => onNavigate('HEALTH_HUB')}
              className="w-full bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800">Find Specialists</h3>
                <p className="text-sm text-gray-500">Connect with pediatric specialists</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            {/* Previous Reports */}
            {reports.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Previous Reports</h3>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => onNavigate('GENERATED_REPORT', { reportId: report.id })}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-800">
                          Report - {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                        {report.overallScore && (
                          <p className="text-xs text-gray-500">Score: {report.overallScore}</p>
                        )}
                      </div>
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PediatricianReportView;
