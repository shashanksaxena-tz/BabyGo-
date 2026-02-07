import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  BookOpen,
  Globe,
  Search,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import apiService from '../services/apiService';

interface WHOSource {
  id?: string;
  title: string;
  url: string;
  organization: string;
  region?: string;
  year?: number;
  type: string;
  description?: string;
  domain?: string;
  citation?: string;
}

interface WHOEvidenceViewProps {
  context?: string;
  analysisId?: string;
  region?: string;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

const METHODOLOGY_STEPS = [
  {
    step: 1,
    title: 'Data Collection',
    description:
      'We gather developmental data from photos, videos, and parent observations using advanced AI analysis.',
  },
  {
    step: 2,
    title: 'WHO Standard Comparison',
    description:
      'Your child\'s development is compared against WHO Child Growth Standards and developmental milestones for their age group.',
  },
  {
    step: 3,
    title: 'Evidence-Based Recommendations',
    description:
      'Personalized recommendations are generated based on peer-reviewed research and WHO guidelines.',
  },
];

const WHOEvidenceView: React.FC<WHOEvidenceViewProps> = ({
  context,
  analysisId,
  region,
  onBack,
  onNavigate,
}) => {
  const [sources, setSources] = useState<WHOSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
  }, [context, analysisId, region]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (context) params.context = context;
      if (analysisId) params.analysisId = analysisId;
      if (region) params.region = region;

      const result = await apiService.getWHOEvidence(params);
      if (result.data && Array.isArray(result.data)) {
        setSources(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch WHO evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOrgBadge = (org: string) => {
    switch (org) {
      case 'WHO':
        return 'bg-blue-100 text-blue-700';
      case 'CDC':
        return 'bg-green-100 text-green-700';
      case 'AAP':
        return 'bg-purple-100 text-purple-700';
      case 'UNICEF':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDomainBadge = (domain?: string) => {
    switch (domain) {
      case 'motor':
        return 'bg-blue-50 text-blue-600';
      case 'cognitive':
        return 'bg-purple-50 text-purple-600';
      case 'language':
        return 'bg-pink-50 text-pink-600';
      case 'social':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">WHO Evidence Base</h1>
            <p className="text-white/80 text-sm">Scientific sources & methodology</p>
          </div>
          <Globe className="w-8 h-8 ml-auto opacity-60" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 pb-24">
        {/* Trust Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-teal-800">Trusted Sources</h3>
              <p className="text-sm text-teal-700 mt-1">
                All assessments and recommendations are based on peer-reviewed research from the World Health Organization,
                CDC, American Academy of Pediatrics, and UNICEF.
              </p>
            </div>
          </div>
        </div>

        {/* Source Cards */}
        <div>
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Research Sources
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No sources found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting the context or run a new analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div key={source.id || index} className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getOrgBadge(source.organization)}`}>
                      {source.organization}
                    </span>
                    {source.domain && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getDomainBadge(source.domain)}`}>
                        {source.domain}
                      </span>
                    )}
                    {source.year && (
                      <span className="text-xs text-gray-500">{source.year}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                      {source.type}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-800 mb-2">{source.title}</h4>

                  {source.description && (
                    <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                  )}

                  {source.citation && (
                    <p className="text-xs text-gray-400 italic mb-3">{source.citation}</p>
                  )}

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    View Full Study
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Our Methodology */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-500" />
            Our Methodology
          </h3>

          <div className="space-y-6">
            {METHODOLOGY_STEPS.map((step, index) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {step.step}
                  </div>
                  {index < METHODOLOGY_STEPS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-teal-200 mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <h4 className="font-bold text-gray-800">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Disclaimer</h4>
              <p className="text-xs text-amber-700 mt-1">
                TinySteps AI provides informational content only and is not a substitute for professional medical advice,
                diagnosis, or treatment. Always consult your pediatrician or qualified healthcare provider with any questions
                about your child's health or development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WHOEvidenceView;
