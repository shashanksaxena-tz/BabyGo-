import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { Plus, Scale, Ruler, CircleDot, TrendingUp, Info, X, Loader2 } from 'lucide-react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useChild, type Child } from '../contexts/ChildContext';
import api from '../api';

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

// Fallback WHO Growth Standards Data extended to 36 months
// Used when the backend /analysis/growth-curves endpoint is unavailable
const WHO_PERCENTILES_FALLBACK: Record<string, Record<string, Record<string, number[]>>> = {
    weight: {
        boys: {
            p3:  [2.5, 3.4, 4.3, 5.0, 5.6, 6.1, 6.5, 6.9, 7.2, 7.5, 7.7, 7.9, 8.1, 8.3, 8.5, 8.7, 8.9, 9.1, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.3, 10.5, 10.6, 10.8, 10.9, 11.1, 11.2, 11.4, 11.5, 11.6, 11.8, 11.9, 12.0],
            p15: [2.9, 3.9, 4.9, 5.7, 6.3, 6.8, 7.3, 7.7, 8.0, 8.3, 8.6, 8.8, 9.0, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.7, 11.8, 12.0, 12.2, 12.3, 12.5, 12.7, 12.8, 13.0, 13.1, 13.3, 13.4],
            p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2, 12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3],
            p85: [3.9, 5.1, 6.3, 7.2, 7.8, 8.4, 8.8, 9.2, 9.6, 9.9, 10.2, 10.5, 10.7, 11.0, 11.3, 11.5, 11.8, 12.0, 12.2, 12.5, 12.7, 12.9, 13.2, 13.4, 13.6, 13.9, 14.0, 14.2, 14.5, 14.7, 14.9, 15.1, 15.3, 15.5, 15.7, 15.9, 16.0],
            p97: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 11.9, 12.3, 12.6, 12.8, 13.1, 13.4, 13.6, 13.9, 14.1, 14.4, 14.7, 14.9, 15.2, 15.4, 15.6, 15.9, 16.1, 16.3, 16.6, 16.8, 17.0, 17.2, 17.5, 17.7, 17.9],
        },
        girls: {
            p3:  [2.4, 3.2, 4.0, 4.6, 5.1, 5.5, 5.9, 6.2, 6.5, 6.7, 6.9, 7.1, 7.3, 7.5, 7.7, 7.9, 8.1, 8.3, 8.4, 8.6, 8.8, 9.0, 9.2, 9.3, 9.5, 9.7, 9.8, 10.0, 10.1, 10.3, 10.4, 10.6, 10.7, 10.8, 11.0, 11.1, 11.2],
            p15: [2.8, 3.6, 4.5, 5.2, 5.8, 6.2, 6.6, 6.9, 7.2, 7.5, 7.7, 7.9, 8.1, 8.3, 8.6, 8.8, 9.0, 9.2, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.0, 11.2, 11.4, 11.5, 11.7, 11.9, 12.0, 12.2, 12.3, 12.5],
            p50: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9],
            p85: [3.7, 4.8, 5.8, 6.6, 7.3, 7.8, 8.2, 8.6, 8.9, 9.2, 9.5, 9.8, 10.0, 10.3, 10.6, 10.8, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2, 12.5, 12.7, 12.9, 13.2, 13.4, 13.6, 13.8, 14.1, 14.3, 14.5, 14.7, 14.9, 15.1, 15.3, 15.6],
            p97: [4.2, 5.5, 6.6, 7.5, 8.2, 8.8, 9.3, 9.7, 10.1, 10.4, 10.7, 11.0, 11.3, 11.6, 11.9, 12.2, 12.5, 12.7, 13.0, 13.2, 13.5, 13.8, 14.0, 14.3, 14.5, 14.8, 15.1, 15.3, 15.6, 15.8, 16.1, 16.3, 16.5, 16.8, 17.0, 17.3, 17.5],
        },
    },
    height: {
        boys: {
            p3:  [46.3, 51.1, 54.7, 57.6, 60.0, 62.0, 63.8, 65.4, 66.9, 68.2, 69.5, 70.7, 71.8, 72.9, 74.0, 75.0, 76.0, 77.0, 77.9, 78.8, 79.7, 80.5, 81.3, 82.1, 82.9, 83.6, 84.4, 85.1, 85.8, 86.5, 87.1, 87.8, 88.4, 89.0, 89.6, 90.2, 90.8],
            p15: [48.0, 53.0, 56.7, 59.7, 62.2, 64.3, 66.1, 67.8, 69.3, 70.7, 72.0, 73.2, 74.3, 75.5, 76.6, 77.6, 78.6, 79.6, 80.6, 81.5, 82.4, 83.3, 84.1, 84.9, 85.7, 86.5, 87.3, 88.0, 88.7, 89.4, 90.1, 90.8, 91.5, 92.1, 92.8, 93.4, 94.0],
            p50: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8, 88.0, 88.8, 89.6, 90.4, 91.2, 91.9, 92.7, 93.4, 94.1, 94.8, 95.4, 96.1],
            p85: [51.8, 56.5, 60.2, 63.2, 65.7, 67.6, 69.2, 70.7, 72.1, 73.4, 74.6, 75.8, 77.0, 78.3, 79.5, 80.6, 81.8, 82.9, 83.9, 85.0, 86.0, 87.0, 87.9, 88.9, 89.8, 90.7, 91.6, 92.5, 93.3, 94.2, 95.0, 95.8, 96.6, 97.4, 98.1, 98.9, 99.6],
            p97: [53.4, 58.1, 61.7, 64.6, 67.0, 68.9, 70.4, 71.9, 73.2, 74.5, 75.7, 76.9, 78.1, 79.4, 80.6, 81.8, 83.0, 84.1, 85.2, 86.3, 87.3, 88.4, 89.4, 90.4, 91.3, 92.3, 93.2, 94.1, 95.0, 95.9, 96.7, 97.6, 98.4, 99.2, 100.0, 100.8, 101.5],
        },
        girls: {
            p3:  [45.6, 50.0, 53.2, 55.8, 57.9, 59.8, 61.5, 63.0, 64.4, 65.7, 66.9, 68.1, 69.2, 70.3, 71.3, 72.3, 73.3, 74.2, 75.1, 76.0, 76.9, 77.7, 78.5, 79.3, 80.1, 80.8, 81.6, 82.3, 83.0, 83.7, 84.3, 85.0, 85.6, 86.2, 86.9, 87.4, 88.0],
            p15: [47.2, 51.7, 55.1, 57.8, 60.0, 61.9, 63.6, 65.2, 66.6, 67.9, 69.2, 70.4, 71.5, 72.7, 73.8, 74.8, 75.8, 76.8, 77.8, 78.7, 79.6, 80.5, 81.3, 82.2, 83.0, 83.8, 84.6, 85.3, 86.1, 86.8, 87.5, 88.2, 88.9, 89.6, 90.3, 90.9, 91.5],
            p50: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4, 86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.4, 92.2, 92.9, 93.6, 94.4, 95.1],
            p85: [51.1, 55.8, 59.2, 61.9, 64.3, 66.2, 67.9, 69.5, 70.9, 72.3, 73.7, 75.1, 76.4, 77.7, 79.0, 80.2, 81.4, 82.6, 83.7, 84.8, 85.9, 86.9, 87.9, 88.9, 89.9, 90.9, 91.8, 92.8, 93.7, 94.6, 95.5, 96.4, 97.3, 98.1, 98.9, 99.8, 100.6],
            p97: [52.7, 57.4, 60.9, 63.6, 66.0, 67.9, 69.6, 71.2, 72.7, 74.1, 75.5, 76.9, 78.3, 79.6, 81.0, 82.3, 83.5, 84.8, 86.0, 87.1, 88.3, 89.4, 90.5, 91.5, 92.6, 93.6, 94.6, 95.6, 96.5, 97.5, 98.4, 99.4, 100.3, 101.2, 102.0, 102.9, 103.7],
        },
    },
    head: {
        boys: {
            p3:  [32.1, 35.1, 36.9, 38.3, 39.4, 40.3, 41.0, 41.7, 42.2, 42.7, 43.1, 43.5, 43.8, 44.1, 44.3, 44.5, 44.7, 44.9, 45.1, 45.2, 45.4, 45.5, 45.6, 45.8, 45.9, 46.0, 46.1, 46.2, 46.3, 46.4, 46.5, 46.6, 46.7, 46.8, 46.9, 47.0, 47.1],
            p15: [33.2, 36.1, 38.0, 39.3, 40.4, 41.2, 41.9, 42.5, 43.1, 43.5, 43.9, 44.3, 44.6, 44.9, 45.1, 45.3, 45.5, 45.7, 45.9, 46.0, 46.2, 46.3, 46.5, 46.6, 46.7, 46.9, 47.0, 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 47.7, 47.8, 47.9, 48.0],
            p50: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1, 46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8, 48.0, 48.1, 48.3, 48.4, 48.5, 48.6, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6],
            p85: [35.8, 38.5, 40.3, 41.7, 42.8, 43.9, 44.7, 45.4, 46.0, 46.5, 46.9, 47.3, 47.6, 47.9, 48.1, 48.3, 48.5, 48.7, 48.9, 49.1, 49.2, 49.4, 49.5, 49.7, 49.8, 49.9, 50.1, 50.2, 50.3, 50.4, 50.5, 50.7, 50.8, 50.9, 51.0, 51.1, 51.2],
            p97: [36.9, 39.5, 41.3, 42.7, 43.8, 44.9, 45.8, 46.5, 47.1, 47.6, 48.1, 48.5, 48.8, 49.1, 49.4, 49.6, 49.8, 50.0, 50.2, 50.4, 50.5, 50.7, 50.8, 51.0, 51.1, 51.3, 51.4, 51.5, 51.6, 51.8, 51.9, 52.0, 52.1, 52.2, 52.3, 52.4, 52.5],
        },
        girls: {
            p3:  [31.7, 34.3, 36.0, 37.2, 38.2, 39.0, 39.7, 40.3, 40.8, 41.2, 41.6, 41.9, 42.2, 42.5, 42.7, 42.9, 43.1, 43.3, 43.5, 43.6, 43.8, 43.9, 44.1, 44.2, 44.3, 44.5, 44.6, 44.7, 44.8, 44.9, 45.0, 45.1, 45.2, 45.3, 45.4, 45.5, 45.6],
            p15: [32.7, 35.3, 37.0, 38.2, 39.2, 40.0, 40.7, 41.3, 41.8, 42.2, 42.6, 42.9, 43.2, 43.5, 43.7, 43.9, 44.1, 44.3, 44.5, 44.6, 44.8, 44.9, 45.1, 45.2, 45.4, 45.5, 45.6, 45.7, 45.8, 45.9, 46.1, 46.2, 46.3, 46.4, 46.5, 46.6, 46.7],
            p50: [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9, 45.2, 45.4, 45.7, 45.9, 46.1, 46.2, 46.4, 46.6, 46.7, 46.9, 47.0, 47.2, 47.3, 47.4, 47.5, 47.6, 47.8, 47.9, 48.0, 48.1, 48.2, 48.3, 48.4, 48.5],
            p85: [35.1, 37.8, 39.5, 40.8, 41.9, 42.9, 43.7, 44.4, 44.9, 45.4, 45.9, 46.3, 46.6, 46.9, 47.2, 47.4, 47.6, 47.8, 48.0, 48.2, 48.4, 48.5, 48.7, 48.9, 49.0, 49.2, 49.3, 49.4, 49.5, 49.7, 49.8, 49.9, 50.0, 50.1, 50.2, 50.3, 50.4],
            p97: [36.1, 38.8, 40.5, 41.9, 43.0, 44.1, 44.9, 45.6, 46.2, 46.7, 47.2, 47.6, 48.0, 48.3, 48.6, 48.8, 49.1, 49.3, 49.5, 49.7, 49.9, 50.0, 50.2, 50.4, 50.5, 50.7, 50.8, 50.9, 51.1, 51.2, 51.3, 51.4, 51.6, 51.7, 51.8, 51.9, 52.0],
        },
    },
};

export default function GrowthCharts() {
    const { activeChild } = useChild();
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
    const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [percentile, setPercentile] = useState<number>(50);
    const [showAddModal, setShowAddModal] = useState(false);
    // WHO curves fetched from backend, keyed by "gender-metric"
    const [whoCurves, setWhoCurves] = useState<Record<string, WHOCurveData>>({});

    const child = activeChild;

    // Calculate age in months from DOB
    const getAgeMonths = () => {
        if (!child?.dateOfBirth) return 6;
        const today = new Date();
        const dob = new Date(child.dateOfBirth);
        return (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    };

    const ageMonths = getAgeMonths();
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
            // Backend endpoint unavailable -- fallback data will be used
            console.warn('Growth curves endpoint unavailable, using fallback data');
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

    const getPercentileInterpretation = (p: number) => {
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

        // Determine max month for the chart
        let maxDataMonth: number;

        if (backendCurves) {
            // Use backend WHO curves
            maxDataMonth = Math.max(...backendCurves.ageMonths);
        } else {
            // Use fallback data
            const genderKey = gender === 'female' ? 'girls' : 'boys';
            const fallback = WHO_PERCENTILES_FALLBACK[selectedMetric]?.[genderKey];
            maxDataMonth = fallback ? fallback.p50.length - 1 : 12;
        }

        const chartMax = Math.min(ageMonths + 3, maxDataMonth);

        const data = [];
        for (let month = 0; month <= chartMax; month++) {
            let p3: number | undefined, p15: number | undefined, p50: number | undefined, p85: number | undefined, p97: number | undefined;

            if (backendCurves) {
                const idx = backendCurves.ageMonths.indexOf(month);
                if (idx !== -1) {
                    p3 = backendCurves.percentiles.p3[idx];
                    p15 = backendCurves.percentiles.p15[idx];
                    p50 = backendCurves.percentiles.p50[idx];
                    p85 = backendCurves.percentiles.p85[idx];
                    p97 = backendCurves.percentiles.p97[idx];
                }
            } else {
                const genderKey = gender === 'female' ? 'girls' : 'boys';
                const fallback = WHO_PERCENTILES_FALLBACK[selectedMetric]?.[genderKey];
                if (fallback && month < fallback.p50.length) {
                    p3 = fallback.p3[month];
                    p15 = fallback.p15[month];
                    p50 = fallback.p50[month];
                    p85 = fallback.p85[month];
                    p97 = fallback.p97[month];
                }
            }

            if (p50 === undefined) continue; // skip months without data

            const dataPoint: Record<string, number | undefined> = {
                month,
                p3,
                p15,
                p50,
                p85,
                p97,
            };

            // Plot child's current value at their age
            if (month === ageMonths) {
                dataPoint.child = getCurrentValue();
            }

            // Also plot historical measurements at their respective ages
            const matchingMeasurements = measurements.filter(m => {
                if (m.ageMonths !== undefined) return m.ageMonths === month;
                // Calculate age from measurement date if ageMonths not provided
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
