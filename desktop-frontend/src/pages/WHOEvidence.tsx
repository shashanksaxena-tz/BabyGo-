import { useState, useEffect, useCallback, useMemo } from 'react';
import TopBar from '../components/TopBar';
import {
    BookOpen,
    ExternalLink,
    Shield,
    Globe,
    Search,
    Info,
    AlertTriangle,
    Loader2,
    AlertCircle,
    Baby,
    ChevronDown,
    ChevronUp,
    Filter,
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api from '../api';

// --- Types ---

interface WHOSource {
    id: string;
    title: string;
    url: string;
    organization: string;
    type: string;
    description?: string;
    domain?: string;
    year?: number;
    citation?: string;
}

interface MethodologyStep {
    step: number;
    title: string;
    description: string;
    icon?: string;
}

// --- Constants ---

const FALLBACK_SOURCES: WHOSource[] = [
    {
        id: 'who-motor',
        title: 'WHO Motor Development Study',
        url: 'https://www.who.int/publications/i/item/WHO-TRS-1006',
        organization: 'WHO',
        type: 'study',
        description: 'WHO Multicentre Growth Reference Study: Motor development milestones',
    },
    {
        id: 'who-growth',
        title: 'WHO Child Growth Standards',
        url: 'https://www.who.int/tools/child-growth-standards',
        organization: 'WHO',
        type: 'standard',
        description: 'WHO Child Growth Standards: Methods and development',
    },
    {
        id: 'who-milestones',
        title: 'WHO Developmental Milestones',
        url: 'https://www.who.int/publications/i/item/9789241596503',
        organization: 'WHO',
        type: 'study',
        description: 'WHO Motor Development Study: Windows of achievement',
    },
    {
        id: 'unicef-ecd',
        title: 'UNICEF Early Childhood Development',
        url: 'https://www.unicef.org/early-childhood-development',
        organization: 'UNICEF',
        type: 'reference',
        description: 'Evidence-based early childhood development resources',
    },
    {
        id: 'cdc-milestones',
        title: 'CDC Developmental Milestones',
        url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
        organization: 'CDC',
        type: 'reference',
        description: 'Learn the Signs. Act Early. Developmental milestones',
    },
];

const METHODOLOGY_STEPS: MethodologyStep[] = [
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
            "Your child's development is compared against WHO Child Growth Standards and developmental milestones for their age group.",
    },
    {
        step: 3,
        title: 'Evidence-Based Recommendations',
        description:
            'Personalized recommendations are generated based on peer-reviewed research and WHO guidelines.',
    },
];

// --- Helpers ---

function inferOrganization(source: any): string {
    const title = (source?.title || '').toLowerCase();
    const url = (source?.url || '').toLowerCase();
    if (title.includes('who') || url.includes('who.int')) return 'WHO';
    if (title.includes('cdc') || url.includes('cdc.gov')) return 'CDC';
    if (title.includes('aap') || url.includes('aap.org')) return 'AAP';
    if (title.includes('unicef') || url.includes('unicef.org')) return 'UNICEF';
    return 'Research';
}

function mapSource(s: any, index: number): WHOSource {
    return {
        id: s?._id || s?.id || `source-${index}`,
        title: s?.title || 'Untitled Source',
        url: s?.url || '#',
        organization: s?.organization || inferOrganization(s),
        year: s?.year,
        type: s?.type || 'reference',
        description: s?.description,
        domain: s?.domain,
        citation: s?.citation,
    };
}

function getOrgBadgeStyle(org: string): string {
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
}

function getDomainBadgeStyle(domain?: string): string {
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
}

// --- Main Page ---

export default function WHOEvidence() {
    const { activeChild } = useChild();
    const childId = activeChild?._id;

    const [sources, setSources] = useState<WHOSource[]>([]);
    const [methodology, setMethodology] = useState<MethodologyStep[]>(METHODOLOGY_STEPS);
    const [disclaimer, setDisclaimer] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeOrgFilter, setActiveOrgFilter] = useState<string | null>(null);
    const [showMethodology, setShowMethodology] = useState(true);

    const fetchSources = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch from the recommendations/sources endpoint
            const res = await api.get('/recommendations/sources');
            const data = res.data;

            if (data) {
                const rawSources = Array.isArray(data) ? data : data?.sources || [];
                setSources(rawSources.map((s: any, i: number) => mapSource(s, i)));

                if (data.methodology) {
                    setMethodology(data.methodology);
                }
                if (data.disclaimer) {
                    setDisclaimer(data.disclaimer);
                }
            }

            // Also fetch analysis-level sources if a child is selected
            if (childId) {
                try {
                    const analysisRes = await api.get(`/analysis/${childId}`);
                    const analyses = analysisRes.data?.analyses || [];

                    // Collect unique sources from all analyses
                    const analysisSources: WHOSource[] = [];
                    const seenUrls = new Set(sources.map(s => s.url));

                    for (const analysis of analyses) {
                        if (Array.isArray(analysis.sources)) {
                            for (const s of analysis.sources) {
                                if (s.url && !seenUrls.has(s.url)) {
                                    seenUrls.add(s.url);
                                    analysisSources.push(
                                        mapSource({ ...s, domain: 'analysis' }, analysisSources.length)
                                    );
                                }
                            }
                        }
                    }

                    if (analysisSources.length > 0) {
                        setSources(prev => [...prev, ...analysisSources]);
                    }
                } catch {
                    // Non-fatal: analysis sources are supplementary
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch WHO evidence sources:', err);
            setError(err?.response?.data?.error || 'Failed to load evidence sources');
            // On failure, use fallback sources
            setSources(FALLBACK_SOURCES);
        } finally {
            setLoading(false);
        }
    }, [childId]);

    useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    // Compute unique organizations for filter chips
    const organizations = useMemo(() => {
        const orgs = new Set<string>();
        for (const s of sources) {
            orgs.add(s.organization);
        }
        return Array.from(orgs).sort();
    }, [sources]);

    // Filtered sources based on search and org filter
    const filteredSources = useMemo(() => {
        let result = sources;

        if (activeOrgFilter) {
            result = result.filter(s => s.organization === activeOrgFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                s =>
                    s.title.toLowerCase().includes(q) ||
                    (s.description || '').toLowerCase().includes(q) ||
                    s.organization.toLowerCase().includes(q) ||
                    (s.domain || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [sources, activeOrgFilter, searchQuery]);

    // Group filtered sources by organization
    const groupedSources = useMemo(() => {
        const groups: Record<string, WHOSource[]> = {};
        for (const s of filteredSources) {
            if (!groups[s.organization]) {
                groups[s.organization] = [];
            }
            groups[s.organization].push(s);
        }
        return groups;
    }, [filteredSources]);

    const orgOrder = ['WHO', 'CDC', 'AAP', 'UNICEF', 'Research'];

    const sortedOrgKeys = useMemo(() => {
        const keys = Object.keys(groupedSources);
        return keys.sort((a, b) => {
            const idxA = orgOrder.indexOf(a);
            const idxB = orgOrder.indexOf(b);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
    }, [groupedSources]);

    // --- No child selected state ---
    if (!childId) {
        return (
            <div className="flex-1 flex flex-col min-h-0">
                <TopBar title="WHO Evidence Base" subtitle="Scientific sources & methodology" />
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Baby className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-800 mb-2">No Child Selected</h3>
                            <p className="text-sm text-gray-500">
                                Please select a child profile to view evidence sources related to their assessment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <TopBar title="WHO Evidence Base" subtitle="Scientific sources & methodology" />
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Trust Banner */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-800 text-lg">Trusted Sources</h3>
                                <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                                    All assessments and recommendations are based on peer-reviewed research from the
                                    World Health Organization, CDC, American Academy of Pediatrics, and UNICEF.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search sources by title, description, or organization..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none ml-3 text-sm w-full text-gray-700 placeholder-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-gray-400 hover:text-gray-600 ml-2"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Organization filter chips */}
                        {organizations.length > 1 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <button
                                    onClick={() => setActiveOrgFilter(null)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                        activeOrgFilter === null
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    All ({sources.length})
                                </button>
                                {organizations.map(org => {
                                    const count = sources.filter(s => s.organization === org).length;
                                    return (
                                        <button
                                            key={org}
                                            onClick={() =>
                                                setActiveOrgFilter(activeOrgFilter === org ? null : org)
                                            }
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                                activeOrgFilter === org
                                                    ? 'bg-emerald-500 text-white'
                                                    : `${getOrgBadgeStyle(org)} hover:opacity-80`
                                            }`}
                                        >
                                            {org} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Source Cards */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                            Research Sources
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''} found
                            {activeOrgFilter ? ` for ${activeOrgFilter}` : ''}
                            {searchQuery ? ` matching "${searchQuery}"` : ''}
                        </p>

                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="text-center">
                                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500 text-sm">Loading evidence sources...</p>
                                </div>
                            </div>
                        ) : error && sources.length === 0 ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="text-center max-w-sm">
                                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2">Failed to load sources</h3>
                                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                                    <button
                                        onClick={fetchSources}
                                        className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        ) : filteredSources.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">No sources found</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Try adjusting your search or filter criteria
                                </p>
                                {(searchQuery || activeOrgFilter) && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setActiveOrgFilter(null);
                                        }}
                                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {sortedOrgKeys.map(orgName => (
                                    <div key={orgName}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Globe className="w-4 h-4 text-gray-400" />
                                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                                                {orgName}
                                            </h3>
                                            <span className="text-xs text-gray-400">
                                                ({groupedSources[orgName].length})
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {groupedSources[orgName].map((source, index) => (
                                                <div
                                                    key={source.id || index}
                                                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getOrgBadgeStyle(
                                                                source.organization
                                                            )}`}
                                                        >
                                                            {source.organization}
                                                        </span>
                                                        {source.domain && source.domain !== 'general' && (
                                                            <span
                                                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getDomainBadgeStyle(
                                                                    source.domain
                                                                )}`}
                                                            >
                                                                {source.domain}
                                                            </span>
                                                        )}
                                                        {source.year && (
                                                            <span className="text-xs text-gray-500">
                                                                {source.year}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                                                            {source.type}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-gray-800 mb-2 group-hover:text-emerald-700 transition-colors">
                                                        {source.title}
                                                    </h4>

                                                    {source.description && (
                                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                            {source.description}
                                                        </p>
                                                    )}

                                                    {source.citation && (
                                                        <p className="text-xs text-gray-400 italic mb-3">
                                                            {source.citation}
                                                        </p>
                                                    )}

                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                                    >
                                                        View Full Study
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Methodology Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <button
                            onClick={() => setShowMethodology(!showMethodology)}
                            className="w-full flex items-center justify-between"
                        >
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Info className="w-5 h-5 text-purple-500" />
                                Our Methodology
                            </h3>
                            {showMethodology ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {showMethodology && (
                            <div className="mt-6 space-y-6">
                                {methodology.map((step, index) => (
                                    <div key={step.step} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                                                {step.step}
                                            </div>
                                            {index < methodology.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-emerald-200 mt-2" />
                                            )}
                                        </div>
                                        <div className="pb-6">
                                            <h4 className="font-bold text-gray-800">{step.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-800 text-sm">Disclaimer</h4>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    {disclaimer ||
                                        'TinySteps AI provides informational content only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your pediatrician or qualified healthcare provider with any questions about your child\'s health or development.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
