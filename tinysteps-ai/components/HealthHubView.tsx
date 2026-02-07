import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  Sparkles,
  Stethoscope,
  Shield,
  DollarSign,
} from 'lucide-react';
import apiService from '../services/apiService';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount?: number;
  experience: string;
  distance?: string;
  fee?: string;
  recommended?: boolean;
  imageUrl?: string;
  phone?: string;
  availableSlots?: string[];
  qualifications?: string[];
}

interface HealthHubViewProps {
  childId: string;
  childName?: string;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'pediatrician', label: 'Pediatricians' },
  { id: 'speech', label: 'Speech' },
  { id: 'therapy', label: 'Therapy' },
];

const HealthHubView: React.FC<HealthHubViewProps> = ({
  childId,
  childName,
  onBack,
  onNavigate,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [childId, activeCategory]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: { specialty?: string } = {};
      if (activeCategory !== 'all') params.specialty = activeCategory;

      const [recommendedResult, allResult] = await Promise.all([
        apiService.getRecommendedDoctors(childId),
        apiService.getDoctors(params),
      ]);

      const recommendedIds = new Set<string>();
      const recommendedDocs: Doctor[] = [];
      if (recommendedResult.data && Array.isArray(recommendedResult.data)) {
        (recommendedResult.data as Doctor[]).forEach((d) => {
          recommendedIds.add(d.id);
          recommendedDocs.push({ ...d, recommended: true });
        });
      }

      const otherDocs: Doctor[] = [];
      if (allResult.data && Array.isArray(allResult.data)) {
        (allResult.data as Doctor[]).forEach((d) => {
          if (!recommendedIds.has(d.id)) {
            otherDocs.push(d);
          }
        });
      }

      setDoctors([...recommendedDocs, ...otherDocs]);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Health Hub</h1>
            <p className="text-white/80 text-sm">Find specialists near you</p>
          </div>
          <Stethoscope className="w-8 h-8 ml-auto opacity-60" />
        </div>

        {/* AI Recommendation Banner */}
        {childName && (
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">AI Recommendations</p>
              <p className="text-xs text-white/80">Based on {childName}'s development report</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="px-6 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="px-6 pb-24 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-red-400" />
            </div>
            <p className="font-semibold text-gray-800 mb-2">No specialists found</p>
            <p className="text-sm text-gray-500">Try changing the category filter</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${
                doctor.recommended ? 'ring-2 ring-amber-400 ring-offset-2' : ''
              }`}
            >
              {doctor.recommended && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Recommended for your child
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  doctor.recommended ? 'bg-amber-50' : 'bg-gray-100'
                }`}>
                  <Stethoscope className={`w-6 h-6 ${
                    doctor.recommended ? 'text-amber-600' : 'text-gray-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800">{doctor.name}</h3>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>

                  <div className="flex items-center gap-1 mt-1.5">
                    {renderStars(doctor.rating)}
                    <span className="text-xs text-gray-500 ml-1">
                      {doctor.rating} {doctor.reviewCount ? `(${doctor.reviewCount})` : ''}
                    </span>
                  </div>

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
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-2" />
              </div>

              {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthHubView;
