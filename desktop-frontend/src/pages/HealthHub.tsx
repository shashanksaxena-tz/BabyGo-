import { useState, useEffect, useCallback, type ReactElement } from 'react';
import TopBar from '../components/TopBar';
import {
    Stethoscope, Star, Clock, MapPin, DollarSign, Phone,
    Shield, Sparkles, Search, RefreshCw, Loader2, AlertTriangle,
    GraduationCap, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api from '../api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    subSpecialty?: string;
    rating: number;
    experience: string;
    experienceYears?: number;
    distance?: string;
    fee?: string;
    qualifications?: string[];
    domains?: string[];
    location?: {
        clinic?: string;
        address?: string;
        city?: string;
    };
    availableDays?: string[];
    recommended: boolean;
    recommendationReason?: string;
}

interface DomainScore {
    score: number;
    status: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALTIES = [
    { id: 'all', label: 'All Specialists' },
    { id: 'pediatrician', label: 'Pediatricians' },
    { id: 'speech', label: 'Speech Therapists' },
    { id: 'occupational', label: 'Occupational Therapists' },
    { id: 'neurologist', label: 'Neurologists' },
    { id: 'psychologist', label: 'Psychologists' },
    { id: 'physiotherapist', label: 'Physiotherapists' },
];

const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
        case 'motor':
            return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
        case 'language':
            return { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' };
        case 'cognitive':
            return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' };
        case 'social':
            return { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' };
        default:
            return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-500' };
    }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDoctor(d: any, isRecommended: boolean): Doctor {
    return {
        id: d?._id || d?.id || '',
        name: d?.name || '',
        specialty: d?.specialty || '',
        subSpecialty: d?.subSpecialty,
        rating: d?.rating || 0,
        experience: typeof d?.experience === 'string'
            ? d.experience
            : `${d?.experienceYears || 0} yrs`,
        experienceYears: d?.experienceYears,
        distance: typeof d?.distance === 'string'
            ? d.distance
            : d?.distance != null ? `${d.distance} km` : undefined,
        fee: typeof d?.fee === 'string'
            ? d.fee
            : d?.consultationFee != null ? `${d?.currency || 'INR'} ${d.consultationFee}` : undefined,
        qualifications: d?.qualifications || [],
        domains: d?.domains || [],
        location: d?.location,
        availableDays: d?.availableDays || [],
        recommended: isRecommended || d?.isRecommended || false,
        recommendationReason: d?.recommendationReason,
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HealthHub() {
    const { activeChild } = useChild();
    const child = activeChild;

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [flaggedDomains, setFlaggedDomains] = useState<string[]>([]);
    const [domainScores, setDomainScores] = useState<Record<string, DomainScore>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeSpecialty, setActiveSpecialty] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

    // ------------------------------------------------------------------
    // Data fetching
    // ------------------------------------------------------------------

    const fetchDoctors = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        setError(null);

        try {
            const params: Record<string, string> = {};
            if (activeSpecialty !== 'all') params.specialty = activeSpecialty;

            const [recommendedRes, allRes] = await Promise.all([
                api.get(`/doctors/recommended/${child._id}`).catch(() => ({ data: null })),
                api.get('/doctors', { params }).catch(() => ({ data: null })),
            ]);

            const recommendedIds = new Set<string>();
            const recommendedDocs: Doctor[] = [];
            const recData = recommendedRes?.data as any;

            // Store flagged domains and scores
            if (recData?.flaggedDomains) setFlaggedDomains(recData.flaggedDomains);
            if (recData?.domainScores) setDomainScores(recData.domainScores);

            // Process recommended doctors
            const recList = recData?.recommended || [];
            (Array.isArray(recList) ? recList : []).forEach((d: any) => {
                const doc = mapDoctor(d, true);
                if (doc.id) {
                    recommendedIds.add(doc.id);
                    recommendedDocs.push(doc);
                }
            });

            // Process "others" from recommended endpoint
            const recOthers = recData?.others || [];
            (Array.isArray(recOthers) ? recOthers : []).forEach((d: any) => {
                const doc = mapDoctor(d, false);
                if (doc.id && !recommendedIds.has(doc.id)) {
                    recommendedIds.add(doc.id);
                    recommendedDocs.push(doc);
                }
            });

            // Add any additional doctors from the general endpoint
            const otherDocs: Doctor[] = [];
            const allData = allRes?.data as any;
            const allList = Array.isArray(allData) ? allData : allData?.doctors || [];
            (Array.isArray(allList) ? allList : []).forEach((d: any) => {
                const doc = mapDoctor(d, false);
                if (doc.id && !recommendedIds.has(doc.id)) {
                    otherDocs.push(doc);
                }
            });

            setDoctors([...recommendedDocs, ...otherDocs]);
        } catch (err: any) {
            console.error('Failed to fetch doctors:', err);
            setError(err.response?.data?.error || 'Failed to load doctors. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [child?._id, activeSpecialty]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    // ------------------------------------------------------------------
    // Filtering
    // ------------------------------------------------------------------

    const filteredDoctors = doctors.filter((doc) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            doc.name.toLowerCase().includes(q) ||
            doc.specialty.toLowerCase().includes(q) ||
            (doc.subSpecialty && doc.subSpecialty.toLowerCase().includes(q)) ||
            (doc.qualifications || []).some(qual => qual.toLowerCase().includes(q))
        );
    });

    const recommendedDoctors = filteredDoctors.filter((d) => d.recommended);
    const otherDoctors = filteredDoctors.filter((d) => !d.recommended);

    // ------------------------------------------------------------------
    // Star renderer
    // ------------------------------------------------------------------

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                    i < Math.floor(rating)
                        ? 'text-amber-400 fill-amber-400'
                        : i < rating
                            ? 'text-amber-400 fill-amber-200'
                            : 'text-gray-200'
                }`}
            />
        ));
    };

    // ------------------------------------------------------------------
    // Guard: no child selected
    // ------------------------------------------------------------------

    if (!child) {
        return (
            <>
                <TopBar title="Health Hub" subtitle="Find doctors and specialists" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Stethoscope className="w-10 h-10 text-emerald-400" />
                        </div>
                        <p className="text-gray-500 text-lg">Please select a child to view doctor recommendations.</p>
                    </div>
                </div>
            </>
        );
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <>
            <TopBar title="Health Hub" subtitle={`Specialists recommended for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* ====================== MAIN CONTENT ====================== */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, specialty, or qualification..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
                        />
                    </div>

                    {/* Specialty Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {SPECIALTIES.map((spec) => (
                            <button
                                key={spec.id}
                                onClick={() => setActiveSpecialty(spec.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition duration-200 ${
                                    activeSpecialty === spec.id
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {spec.label}
                            </button>
                        ))}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-emerald-500/20">
                                <Stethoscope className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-gray-700 font-bold text-lg">Finding specialists...</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Analyzing {child.name}'s development to find the best match
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-800 mb-1">Something went wrong</h3>
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchDoctors}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                        </div>
                    )}

                    {/* Doctor Lists */}
                    {!loading && !error && (
                        <>
                            {/* Recommended Doctors Section */}
                            {recommendedDoctors.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        <h2 className="text-lg font-bold font-heading text-gray-900">
                                            Recommended for {child.name}
                                        </h2>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold">
                                            {recommendedDoctors.length} match{recommendedDoctors.length !== 1 ? 'es' : ''}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {recommendedDoctors.map((doctor) => (
                                            <DoctorCard
                                                key={doctor.id}
                                                doctor={doctor}
                                                renderStars={renderStars}
                                                isExpanded={expandedDoctor === doctor.id}
                                                onToggle={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Doctors Section */}
                            {otherDoctors.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-gray-400" />
                                        <h2 className="text-lg font-bold font-heading text-gray-900">
                                            All Specialists
                                        </h2>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">
                                            {otherDoctors.length}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {otherDoctors.map((doctor) => (
                                            <DoctorCard
                                                key={doctor.id}
                                                doctor={doctor}
                                                renderStars={renderStars}
                                                isExpanded={expandedDoctor === doctor.id}
                                                onToggle={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {filteredDoctors.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Stethoscope className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No specialists found</h3>
                                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                                        {searchQuery
                                            ? `No doctors matching "${searchQuery}". Try adjusting your search.`
                                            : 'No specialists available for the selected category. Try a different filter.'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setActiveSpecialty('all');
                                        }}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
                                    >
                                        <RefreshCw className="w-5 h-5" /> Clear Filters
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ====================== SIDEBAR ====================== */}
                <div className="xl:w-1/4 flex flex-col gap-6">

                    {/* Refresh CTA */}
                    <button
                        onClick={fetchDoctors}
                        disabled={loading}
                        className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden text-center cursor-pointer hover:shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {loading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <RefreshCw className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <h3 className="font-bold font-heading text-lg mb-2">
                            {loading ? 'Loading...' : 'Refresh Results'}
                        </h3>
                        <p className="text-white/90 text-sm font-medium leading-relaxed px-2">
                            Re-analyze {child.name}'s development and update recommendations.
                        </p>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    </button>

                    {/* Flagged Domains Card */}
                    {flaggedDomains.length > 0 && (
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                            <h3 className="font-bold font-heading text-lg text-gray-900 mb-1 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500" />
                                Areas of Focus
                            </h3>
                            <p className="text-xs text-gray-400 mb-4">
                                Based on {child.name}'s latest analysis
                            </p>
                            <div className="space-y-3">
                                {flaggedDomains.map((domain) => {
                                    const colors = getDomainColor(domain);
                                    const score = domainScores[domain];
                                    return (
                                        <div key={domain} className={`flex items-center justify-between p-3 rounded-xl ${colors.bg}`}>
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                                                <span className={`text-sm font-semibold capitalize ${colors.text}`}>
                                                    {domain}
                                                </span>
                                            </div>
                                            {score && (
                                                <div className="text-right">
                                                    <span className={`text-xs font-bold ${colors.text}`}>
                                                        {score.score}/100
                                                    </span>
                                                    <p className="text-xs text-gray-400 capitalize">
                                                        {score.status.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="font-bold font-heading text-lg text-gray-900 mb-4">Overview</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm text-gray-600">Recommended</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{recommendedDoctors.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-gray-600">Total Specialists</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{doctors.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-gray-600">Flagged Domains</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{flaggedDomains.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-5">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Doctor recommendations are based on your child's developmental analysis and are for informational purposes only.
                                Always consult your pediatrician before scheduling specialist visits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Doctor Card Component
// ---------------------------------------------------------------------------

function DoctorCard({
    doctor,
    renderStars,
    isExpanded,
    onToggle,
}: {
    doctor: Doctor;
    renderStars: (rating: number) => ReactElement[];
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const handleBookAppointment = (e: React.MouseEvent) => {
        e.stopPropagation();
        const searchQuery = encodeURIComponent(
            `${doctor.name} ${doctor.specialty} ${doctor.location?.city || ''}`
        );
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    };

    return (
        <div
            onClick={onToggle}
            className={`bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                doctor.recommended
                    ? 'border-amber-200 ring-1 ring-amber-100'
                    : 'border-gray-50'
            }`}
        >
            <div className="p-5">
                {/* Recommended Badge */}
                {doctor.recommended && (
                    <div className="flex items-center gap-1.5 mb-3">
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            AI Recommended
                        </span>
                    </div>
                )}

                {/* Doctor Info */}
                <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        doctor.recommended ? 'bg-amber-50' : 'bg-emerald-50'
                    }`}>
                        <Stethoscope className={`w-6 h-6 ${
                            doctor.recommended ? 'text-amber-600' : 'text-emerald-600'
                        }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 truncate">{doctor.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {doctor.subSpecialty || doctor.specialty}
                                </p>
                            </div>
                            <div className="p-1 text-gray-300 shrink-0">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-1.5">
                            {renderStars(doctor.rating)}
                            <span className="text-xs text-gray-500 ml-1">{doctor.rating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {doctor.experience}
                    </span>
                    {doctor.distance && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {doctor.distance}
                        </span>
                    )}
                    {doctor.fee && (
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {doctor.fee}
                        </span>
                    )}
                </div>

                {/* Collapsed: brief recommendation reason */}
                {!isExpanded && doctor.recommended && doctor.recommendationReason && (
                    <p className="text-xs text-amber-600 mt-2 line-clamp-1">
                        <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                        {doctor.recommendationReason}
                    </p>
                )}

                {/* Domains - always visible */}
                {doctor.domains && doctor.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {doctor.domains.map((domain, i) => {
                            const colors = getDomainColor(domain);
                            return (
                                <span
                                    key={i}
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}
                                >
                                    {domain}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {/* Qualifications */}
                        {doctor.qualifications && doctor.qualifications.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {doctor.qualifications.map((qual, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium flex items-center gap-1"
                                    >
                                        <GraduationCap className="w-3 h-3" />
                                        {qual}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Recommendation Reason (full) */}
                        {doctor.recommended && doctor.recommendationReason && (
                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                                    {doctor.recommendationReason}
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        {doctor.location?.clinic && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span>
                                    {doctor.location.clinic}
                                    {doctor.location.address ? `, ${doctor.location.address}` : ''}
                                    {doctor.location.city ? `, ${doctor.location.city}` : ''}
                                </span>
                            </div>
                        )}

                        {/* Available Days */}
                        {doctor.availableDays && doctor.availableDays.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>Available: {doctor.availableDays.join(', ')}</span>
                            </div>
                        )}

                        {/* Book Appointment Button */}
                        <button
                            onClick={handleBookAppointment}
                            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                            Book Appointment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
