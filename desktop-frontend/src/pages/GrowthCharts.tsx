import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { Plus, Scale, Ruler, CircleDot, TrendingUp, Info, X, Loader2 } from 'lucide-react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useChild, type Child } from '../contexts/ChildContext';
import api from '../api';
import { useAppConfig } from '../hooks/useAppConfig';

type MetricType = 'weight' | 'height' | 'head';

interface GrowthMeasurement {
    _id?: string;
    id?: string;
    date: string;
    weight?: number;
    height?: number;
    headCircumference?: number;
    ageMonths?: number;
}

interface WHOCurveData {
    ageMonths: number[];
    percentiles: {
        p3: number[];
        p15: number[];
        p50: number[];
        p85: number[];
        p97: number[];
    };
}

export default function GrowthCharts() {
    const { activeChild } = useChild();
    const { config } = useAppConfig();
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
    const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [percentile, setPercentile] = useState<number>(50);
    const [showAddModal, setShowAddModal] = useState(false);
    // WHO curves fetched from backend, keyed by "gender-metric"
    const [whoCurves, setWhoCurves] = useState<Record<string, WHOCurveData>>({});

    const child = activeChild;

    // Use computed ageInMonths from API response, fallback to local calc
    const ageMonths = (child as any)?.ageInMonths ?? (() => {
        if (!child?.dateOfBirth) return 6;
        const today = new Date();
        const dob = new Date(child.dateOfBirth);
        return (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    })();
    const gender = (child?.gender === 'female') ? 'female' : 'male';

    // Fetch WHO growth curves from backend
    const fetchGrowthCurves = useCallback(async () => {
        const backendMetric = selectedMetric === 'head' ? 'headCircumference' : selectedMetric;
        const cacheKey = `${gender}-${backendMetric}`;

        // Skip if already cached
        if (whoCurves[cacheKey]) return;

        try {
            const response = await api.get('/analysis/growth-curves', {
                params: { gender, metric: backendMetric },
            });
            const data = response.data as WHOCurveData;
            if (data?.ageMonths && data?.percentiles) {
                setWhoCurves(prev => ({ ...prev, [cacheKey]: data }));
            }
        } catch (error) {
            console.error('Failed to fetch growth curves:', error);
        }
    }, [gender, selectedMetric, whoCurves]);

    useEffect(() => {
        if (!child?._id) return;
        loadMeasurements();
        calculatePercentile();
        fetchGrowthCurves();
    }, [child?._id, selectedMetric]);

    const loadMeasurements = async () => {
        setLoading(true);
        try {
            // Correct endpoint: GET /api/timeline/measurements/:childId
            const response = await api.get(`/timeline/measurements/${child!._id}`);
            setMeasurements(response.data.measurements || []);
        } catch (error) {
            console.error('Failed to load measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentile = async () => {
        if (!child) return;
        try {
            // Correct endpoint: POST /api/analysis/growth-percentiles
            const response = await api.post('/analysis/growth-percentiles', {
                weight: child.weight,
                height: child.height,
                headCircumference: child.headCircumference,
                ageMonths,
                gender,
            });
            // Backend returns { percentiles: [{ metric, value, percentile, interpretation }, ...] }
            const percentiles: Array<{ metric: string; value: number; percentile: number; interpretation: string }> =
                response.data.percentiles || [];

            let targetMetric: string;
            if (selectedMetric === 'weight') targetMetric = 'weight';
            else if (selectedMetric === 'height') targetMetric = 'height';
            else targetMetric = 'headCircumference';

            const found = percentiles.find(p => p.metric === targetMetric);
            setPercentile(found?.percentile ?? 50);
        } catch (error) {
            console.error('Failed to calculate percentile:', error);
        }
    };

    const getCurrentValue = () => {
        if (!child) return 0;
        switch (selectedMetric) {
            case 'weight': return child.weight || 0;
            case 'height': return child.height || 0;
            case 'head': return child.headCircumference || 0;
            default: return 0;
        }
    };

    const getUnit = () => selectedMetric === 'weight' ? 'kg' : 'cm';

    const getPercentileColor = (p: number) => {
        if (p < 3 || p > 97) return 'text-red-500';
        if (p < 15 || p > 85) return 'text-amber-500';
        return 'text-emerald-500';
    };

    // Use config-driven percentile thresholds, with inline fallback
    const getPercentileInterpretation = (p: number) => {
        if (config?.percentileThresholds) {
            for (const threshold of config.percentileThresholds) {
                if (p <= threshold.max) {
                    return { text: threshold.label, advice: threshold.advice, status: threshold.status };
                }
            }
        }
        // Inline fallback if config not loaded
        if (p < 3) return { text: 'Below typical range', advice: 'Consider consulting your pediatrician', status: 'concern' };
        if (p < 15) return { text: 'Lower end of typical', advice: 'Monitor growth trend over time', status: 'monitor' };
        if (p < 85) return { text: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' };
        if (p < 97) return { text: 'Higher end of typical', advice: 'Monitor growth trend over time', status: 'monitor' };
        return { text: 'Above typical range', advice: 'Consider consulting your pediatrician', status: 'concern' };
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'concern': return 'bg-red-50 text-red-700 border-red-200';
            case 'monitor': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'healthy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getChartData = () => {
        const backendMetric = selectedMetric === 'head' ? 'headCircumference' : selectedMetric;
        const cacheKey = `${gender}-${backendMetric}`;
        const backendCurves = whoCurves[cacheKey];

        if (!backendCurves) return [];

        const maxDataMonth = Math.max(...backendCurves.ageMonths);
        const chartMax = Math.min(ageMonths + 3, maxDataMonth);

        const data = [];
        for (let month = 0; month <= chartMax; month++) {
            const idx = backendCurves.ageMonths.indexOf(month);
            if (idx === -1) continue;

            const dataPoint: Record<string, number | undefined> = {
                month,
                p3: backendCurves.percentiles.p3[idx],
                p15: backendCurves.percentiles.p15[idx],
                p50: backendCurves.percentiles.p50[idx],
                p85: backendCurves.percentiles.p85[idx],
                p97: backendCurves.percentiles.p97[idx],
            };

            // Plot child's current value at their age
            if (month === ageMonths) {
                dataPoint.child = getCurrentValue();
            }

            // Also plot historical measurements at their respective ages
            const matchingMeasurements = measurements.filter(m => {
                if (m.ageMonths !== undefined) return m.ageMonths === month;
                if (child?.dateOfBirth && m.date) {
                    const dob = new Date(child.dateOfBirth);
                    const mDate = new Date(m.date);
                    const mAge = (mDate.getFullYear() - dob.getFullYear()) * 12 + (mDate.getMonth() - dob.getMonth());
                    return mAge === month;
                }
                return false;
            });

            if (matchingMeasurements.length > 0 && month !== ageMonths) {
                const latest = matchingMeasurements[matchingMeasurements.length - 1];
                const val = selectedMetric === 'weight' ? latest.weight
                    : selectedMetric === 'height' ? latest.height
                    : latest.headCircumference;
                if (val) dataPoint.child = val;
            }

            data.push(dataPoint);
        }

        return data;
    };

    const handleAddMeasurement = async (data: { weight?: number; height?: number; headCircumference?: number }) => {
        if (!child) return;
        try {
            // Correct endpoint: POST /api/timeline/measurement
            await api.post('/timeline/measurement', {
                childId: child._id,
                ...data,
                date: new Date().toISOString(),
            });
            loadMeasurements();
            calculatePercentile();
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to add measurement:', error);
        }
    };

    const metrics = [
        { id: 'weight' as MetricType, name: 'Weight', icon: Scale, unit: 'kg' },
        { id: 'height' as MetricType, name: 'Height', icon: Ruler, unit: 'cm' },
        { id: 'head' as MetricType, name: 'Head Circ.', icon: CircleDot, unit: 'cm' },
    ];

    const chartData = getChartData();
    const interpretation = getPercentileInterpretation(percentile);

    if (!child) {
        return (
            <>
                <TopBar title="Growth Charts" subtitle="Track your child's growth over time" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view growth charts.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar title="Growth Charts" subtitle={`WHO Growth Standards for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">

                {/* Top metrics */}
                <div className="grid lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-between">
                            <span className="text-gray-500 font-semibold mb-2">Weight</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-bold font-heading text-gray-900">{child.weight || '\u2014'} kg</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-between">
                            <span className="text-gray-500 font-semibold mb-2">Height</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-bold font-heading text-gray-900">{child.height || '\u2014'} cm</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-between">
                            <span className="text-gray-500 font-semibold mb-2">Head Circ.</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-bold font-heading text-gray-900">{child.headCircumference || '\u2014'} cm</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col justify-center">
                        <span className="text-gray-500 font-semibold mb-2">Current Percentile</span>
                        <div className="flex items-end gap-3 mb-3">
                            <span className={`text-4xl font-bold font-heading ${getPercentileColor(percentile)}`}>{percentile.toFixed(0)}th</span>
                            <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded mb-1 ${getStatusBadgeColor(interpretation.status)}`}>
                                {interpretation.text}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                            {interpretation.advice}
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-6 mt-2">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Tabs */}
                        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-full">
                            {metrics.map((metric) => (
                                <button
                                    key={metric.id}
                                    onClick={() => setSelectedMetric(metric.id)}
                                    className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 ${selectedMetric === metric.id
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <metric.icon className="w-4 h-4" />
                                    {metric.name}
                                </button>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex-1 min-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-gray-900">
                                        {selectedMetric === 'weight' ? 'Weight for Age'
                                            : selectedMetric === 'height' ? 'Height for Age'
                                                : 'Head Circumference'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        WHO {gender === 'female' ? 'Girls' : 'Boys'} Growth Standards
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Current</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {getCurrentValue()} {getUnit()}
                                    </p>
                                    <p className={`text-sm font-medium ${getPercentileColor(percentile)}`}>
                                        {percentile.toFixed(0)}th percentile
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mb-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-8 h-0.5 bg-gray-300" />
                                    <span className="text-gray-500">3rd-97th</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-8 h-0.5 bg-gray-500" />
                                    <span className="text-gray-500">50th (median)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    <span className="text-gray-500">{child.name}</span>
                                </div>
                            </div>
                            <div className="w-full h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                                            tickFormatter={(v) => `${v}mo`}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                            formatter={(value, name) => [
                                                `${((value as number) ?? 0).toFixed(1)} ${getUnit()}`,
                                                (name as string) === 'child'
                                                    ? child.name
                                                    : (name as string).replace('p', '') + 'th percentile',
                                            ]}
                                            labelFormatter={(label) => `${label} months`}
                                        />
                                        <Area type="monotone" dataKey="p97" stroke="none" fill="#f3f4f6" fillOpacity={1} />
                                        <Area type="monotone" dataKey="p3" stroke="none" fill="white" fillOpacity={1} />
                                        <Line type="monotone" dataKey="p97" stroke="#d1d5db" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="p85" stroke="#9ca3af" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="p50" stroke="#6b7280" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="p15" stroke="#9ca3af" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="p3" stroke="#d1d5db" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                                        <Line
                                            type="monotone"
                                            dataKey="child"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ r: 8, fill: '#3b82f6', stroke: 'white', strokeWidth: 3 }}
                                            activeDot={{ r: 10, fill: '#3b82f6', stroke: 'white', strokeWidth: 3 }}
                                            connectNulls
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Percentile Scale */}
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Growth Status
                            </h3>
                            <div className={`p-4 rounded-xl border ${getStatusBadgeColor(interpretation.status)}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {selectedMetric === 'weight' && <Scale className="w-5 h-5" />}
                                        {selectedMetric === 'height' && <Ruler className="w-5 h-5" />}
                                        {selectedMetric === 'head' && <CircleDot className="w-5 h-5" />}
                                        <span className="font-semibold capitalize">{selectedMetric === 'head' ? 'Head Circumference' : selectedMetric}</span>
                                    </div>
                                    <span className="text-lg font-bold">{getCurrentValue()} {getUnit()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{interpretation.text}</span>
                                    <span className="text-sm font-medium">{percentile.toFixed(0)}th percentile</span>
                                </div>
                                <p className="text-xs mt-2 opacity-80">{interpretation.advice}</p>
                            </div>

                            <div className="mt-6">
                                <p className="text-sm text-gray-600 mb-2">Percentile Scale</p>
                                <div className="relative h-8 bg-gradient-to-r from-red-200 via-amber-100 via-emerald-200 to-red-200 rounded-full">
                                    <div
                                        className="absolute top-0 w-1 h-8 bg-blue-600 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-500"
                                        style={{ left: `${percentile}%` }}
                                    />
                                    <div className="absolute -bottom-5 left-0 text-xs text-gray-400">3rd</div>
                                    <div className="absolute -bottom-5 left-[15%] text-xs text-gray-400">15th</div>
                                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium">50th</div>
                                    <div className="absolute -bottom-5 left-[85%] text-xs text-gray-400">85th</div>
                                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400">97th</div>
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-800 font-medium">About WHO Growth Standards</p>
                                <p className="text-sm text-blue-600 mt-1">
                                    These charts show how your child's growth compares to healthy children
                                    worldwide. Being between the 15th and 85th percentile is typical.
                                    Growth patterns are more important than single measurements.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold font-heading text-gray-900 mb-6">Measurement History</h3>
                            <div className="flex-1 overflow-y-auto pr-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    </div>
                                ) : measurements.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-gray-50">
                                            {measurements.slice(0, 10).map((m, i) => (
                                                <tr key={m._id || m.id || i} className="hover:bg-gray-50 transition">
                                                    <td className="py-4 text-gray-600 font-medium">
                                                        {new Date(m.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 font-bold text-gray-900 text-right">
                                                        {selectedMetric === 'weight' && m.weight ? `${m.weight} kg` :
                                                            selectedMetric === 'height' && m.height ? `${m.height} cm` :
                                                                selectedMetric === 'head' && m.headCircumference ? `${m.headCircumference} cm` :
                                                                    '\u2014'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-gray-500 italic py-4">No measurements recorded yet. Log your first measurement below!</p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-600 transition shadow-sm mt-4"
                            >
                                <Plus className="w-5 h-5" /> Log New Measurement
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Measurement Modal */}
            {showAddModal && (
                <AddMeasurementModal
                    child={child}
                    ageMonths={ageMonths}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddMeasurement}
                />
            )}
        </>
    );
}

// Add Measurement Modal Component
function AddMeasurementModal({
    child,
    ageMonths,
    onClose,
    onSave,
}: {
    child: Child;
    ageMonths: number;
    onClose: () => void;
    onSave: (data: { weight?: number; height?: number; headCircumference?: number }) => void;
}) {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [head, setHead] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        await onSave({
            weight: weight ? parseFloat(weight) : undefined,
            height: height ? parseFloat(height) : undefined,
            headCircumference: head ? parseFloat(head) : undefined,
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Add Measurement</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder={`Current: ${child.weight || 'N/A'} kg`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Height (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder={`Current: ${child.height || 'N/A'} cm`}
                        />
                    </div>

                    {ageMonths < 36 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Head Circumference (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={head}
                                onChange={(e) => setHead(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder={`Current: ${child.headCircumference || 'N/A'} cm`}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={(!weight && !height) || saving}
                        className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
