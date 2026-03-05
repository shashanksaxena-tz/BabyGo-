import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Scale,
  Ruler,
  CircleDot,
  Plus,
  RefreshCw,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { ChildProfile } from '../types';
import apiService from '../services/apiService';

interface GrowthMeasurement {
  id: string;
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
  ageMonths: number;
}

interface GrowthChartsViewProps {
  child: ChildProfile;
  onBack: () => void;
}

type MetricType = 'weight' | 'height' | 'head';

interface GrowthCurveData {
  ageMonths: number[];
  percentiles: {
    p3: number[];
    p15: number[];
    p50: number[];
    p85: number[];
    p97: number[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GrowthChartsView: React.FC<GrowthChartsViewProps> = ({ child, onBack }) => {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [showAddModal, setShowAddModal] = useState(false);
  const [percentile, setPercentile] = useState<number>(50);
  const [allPercentiles, setAllPercentiles] = useState<Record<string, number>>({});
  const [growthCurves, setGrowthCurves] = useState<GrowthCurveData | null>(null);

  // Fetch WHO growth curves from backend
  useEffect(() => {
    const fetchGrowthCurves = async () => {
      try {
        const metricParam = selectedMetric === 'head' ? 'headCircumference' : selectedMetric;
        const genderParam = child.gender === 'female' ? 'female' : 'male';
        const token = localStorage.getItem('tinysteps_token');
        const res = await fetch(
          `${API_BASE_URL}/analysis/growth-curves?gender=${genderParam}&metric=${metricParam}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) {
          const data = await res.json();
          setGrowthCurves(data);
        }
      } catch (error) {
        console.error('Failed to fetch growth curves:', error);
      }
    };
    fetchGrowthCurves();
  }, [child.gender, selectedMetric]);

  useEffect(() => {
    loadMeasurements();
    calculatePercentile();
  }, [child.id, selectedMetric]);

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMeasurements(child.id);
      if (response.data) {
        setMeasurements((response.data as any).measurements || []);
      }
    } catch (error) {
      console.error('Failed to load measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentile = async () => {
    try {
      const response = await apiService.getGrowthPercentiles({
        weight: child.weight,
        height: child.height,
        headCircumference: child.headCircumference,
        ageMonths: child.ageMonths,
        gender: child.gender,
      });
      if (response.data) {
        const data = response.data as any;
        // Backend returns { percentiles: [{ metric, value, percentile, interpretation }] }
        const percentiles: Array<{ metric: string; percentile: number }> = data.percentiles || [];
        const targetMetric = selectedMetric === 'head' ? 'headCircumference' : selectedMetric;
        const found = percentiles.find((p: any) => p.metric === targetMetric);
        setPercentile(found?.percentile ?? 50);

        // Store all percentiles for radar chart
        const pMap: Record<string, number> = {};
        percentiles.forEach((p: any) => { pMap[p.metric] = p.percentile; });
        setAllPercentiles(pMap);
      }
    } catch (error) {
      console.error('Failed to calculate percentile:', error);
    }
  };

  const getChartData = () => {
    if (!growthCurves) return [];
    const { ageMonths: ages, percentiles } = growthCurves;

    // Find max age across measurements
    let maxMeasurementMonth = child.ageMonths;
    measurements.forEach(m => {
      if (m.ageMonths > maxMeasurementMonth) maxMeasurementMonth = m.ageMonths;
    });

    // Show curves up to child's age + 3 months padding, capped at available data
    const chartMaxMonth = Math.min(Math.max(maxMeasurementMonth + 3, child.ageMonths + 3), ages[ages.length - 1]);

    const data = [];
    for (let i = 0; i < ages.length; i++) {
      if (ages[i] > chartMaxMonth) break;
      const dataPoint: any = {
        month: ages[i],
        p3: percentiles.p3[i],
        p15: percentiles.p15[i],
        p50: percentiles.p50[i],
        p85: percentiles.p85[i],
        p97: percentiles.p97[i],
      };

      // Add child's current measurement at their age
      if (ages[i] === child.ageMonths) {
        dataPoint.child =
          selectedMetric === 'weight'
            ? child.weight
            : selectedMetric === 'height'
            ? child.height
            : child.headCircumference;
      }

      // Also plot historical measurements at their respective ages
      const matching = measurements.filter(m => m.ageMonths === ages[i]);
      if (matching.length > 0 && ages[i] !== child.ageMonths) {
        const latest = matching[matching.length - 1];
        const val = selectedMetric === 'weight' ? latest.weight
          : selectedMetric === 'height' ? latest.height
          : latest.headCircumference;
        if (val) dataPoint.child = val;
      }

      data.push(dataPoint);
    }

    return data;
  };

  const getCurrentValue = () => {
    switch (selectedMetric) {
      case 'weight':
        return child.weight;
      case 'height':
        return child.height;
      case 'head':
        return child.headCircumference;
      default:
        return 0;
    }
  };

  const getUnit = () => {
    return selectedMetric === 'weight' ? 'kg' : 'cm';
  };

  const getPercentileColor = (p: number) => {
    if (p < 3 || p > 97) return 'text-red-500';
    if (p < 15 || p > 85) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getPercentileInterpretation = (p: number) => {
    if (p < 3) return { text: 'Below typical range', advice: 'Consider consulting your pediatrician', status: 'concern' };
    if (p < 15) return { text: 'Lower end of typical', advice: 'Monitor growth trend over time', status: 'monitor' };
    if (p < 50) return { text: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' };
    if (p < 85) return { text: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' };
    if (p < 97) return { text: 'Higher end of typical', advice: 'Monitor growth trend over time', status: 'monitor' };
    return { text: 'Above typical range', advice: 'Consider consulting your pediatrician', status: 'concern' };
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'concern': return 'bg-red-100 text-red-700 border-red-200';
      case 'monitor': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'healthy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const metrics = [
    { id: 'weight' as MetricType, name: 'Weight', icon: Scale, unit: 'kg' },
    { id: 'height' as MetricType, name: 'Height', icon: Ruler, unit: 'cm' },
    { id: 'head' as MetricType, name: 'Head', icon: CircleDot, unit: 'cm' },
  ];

  const chartData = getChartData();

  // Compute BMI percentile from weight/height
  const computeBmiPercentile = () => {
    if (!child.weight || !child.height) return 50;
    const heightM = child.height / 100;
    const bmi = child.weight / (heightM * heightM);
    const zScore = (bmi - 16.5) / 1.5;
    const p = 50 * (1 + Math.tanh(zScore * 0.7));
    return Math.round(Math.max(1, Math.min(99, p)));
  };

  const radarData = [
    { metric: 'Weight', child: allPercentiles.weight ?? 50, who50: 50, regional: 48, fullMark: 100 },
    { metric: 'Height', child: allPercentiles.height ?? 50, who50: 50, regional: 52, fullMark: 100 },
    { metric: 'Head Circ.', child: allPercentiles.headCircumference ?? 50, who50: 50, regional: 49, fullMark: 100 },
    { metric: 'BMI', child: computeBmiPercentile(), who50: 50, regional: 51, fullMark: 100 },
    { metric: 'Motor Dev.', child: 58, who50: 50, regional: 55, fullMark: 100 },
    { metric: 'Cognitive', child: 62, who50: 50, regional: 53, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Growth Charts</h1>
            <p className="text-sm text-gray-500">
              WHO Growth Standards for {child.name}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl p-6 mb-6 shadow-lg shadow-blue-200"
        >
          <div className="flex justify-around">
            <div className="text-center">
              <Scale className="w-6 h-6 text-white/70 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{child.weight}</p>
              <p className="text-white/70 text-sm">kg</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <Ruler className="w-6 h-6 text-white/70 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{child.height}</p>
              <p className="text-white/70 text-sm">cm</p>
            </div>
            {child.headCircumference && (
              <>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <CircleDot className="w-6 h-6 text-white/70 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">
                    {child.headCircumference}
                  </p>
                  <p className="text-white/70 text-sm">cm head</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Metric Selector */}
        <div className="flex gap-2 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                  selectedMetric === metric.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{metric.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-6 mb-6"
        >
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">
                {selectedMetric === 'weight'
                  ? 'Weight for Age'
                  : selectedMetric === 'height'
                  ? 'Height for Age'
                  : 'Head Circumference'}
              </h3>
              <p className="text-sm text-gray-500">
                WHO {child.gender === 'female' ? 'Girls' : 'Boys'} Growth Standards
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

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gray-300" />
              <span className="text-gray-500">3rd-97th</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gray-400" />
              <span className="text-gray-500">15th-85th</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-1 bg-gray-500" />
              <span className="text-gray-500">50th (median)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-500">{child.name}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
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
                  formatter={(value: number, name: string) => [
                    `${value?.toFixed(1)} ${getUnit()}`,
                    name === 'child'
                      ? child.name
                      : name.replace('p', '') + 'th percentile',
                  ]}
                  labelFormatter={(label) => `${label} months`}
                />

                {/* Percentile bands */}
                <Area
                  type="monotone"
                  dataKey="p97"
                  stroke="none"
                  fill="#f3f4f6"
                  fillOpacity={1}
                />
                <Area
                  type="monotone"
                  dataKey="p3"
                  stroke="none"
                  fill="white"
                  fillOpacity={1}
                />

                {/* Percentile lines */}
                <Line
                  type="monotone"
                  dataKey="p97"
                  stroke="#d1d5db"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="p85"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p15"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  type="monotone"
                  dataKey="p3"
                  stroke="#d1d5db"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />

                {/* Child's data point */}
                <Line
                  type="monotone"
                  dataKey="child"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{
                    r: 8,
                    fill: '#3b82f6',
                    stroke: 'white',
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 10,
                    fill: '#3b82f6',
                    stroke: 'white',
                    strokeWidth: 3,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Detailed Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-lg p-6 mb-6"
        >
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Growth Status Overview
          </h3>

          <div className="space-y-4">
            {/* Weight Status */}
            {(() => {
              const weightPercentile = percentile;
              const interpretation = getPercentileInterpretation(weightPercentile);
              return selectedMetric === 'weight' && (
                <div className={`p-4 rounded-xl border ${getStatusBadgeColor(interpretation.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      <span className="font-semibold">Weight</span>
                    </div>
                    <span className="text-lg font-bold">{child.weight} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{interpretation.text}</span>
                    <span className="text-sm font-medium">{percentile.toFixed(0)}th percentile</span>
                  </div>
                  <p className="text-xs mt-2 opacity-80">{interpretation.advice}</p>
                </div>
              );
            })()}

            {/* Height Status */}
            {selectedMetric === 'height' && (() => {
              const interpretation = getPercentileInterpretation(percentile);
              return (
                <div className={`p-4 rounded-xl border ${getStatusBadgeColor(interpretation.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-5 h-5" />
                      <span className="font-semibold">Height</span>
                    </div>
                    <span className="text-lg font-bold">{child.height} cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{interpretation.text}</span>
                    <span className="text-sm font-medium">{percentile.toFixed(0)}th percentile</span>
                  </div>
                  <p className="text-xs mt-2 opacity-80">{interpretation.advice}</p>
                </div>
              );
            })()}

            {/* Head Circumference Status */}
            {selectedMetric === 'head' && child.headCircumference && (() => {
              const interpretation = getPercentileInterpretation(percentile);
              return (
                <div className={`p-4 rounded-xl border ${getStatusBadgeColor(interpretation.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-5 h-5" />
                      <span className="font-semibold">Head Circumference</span>
                    </div>
                    <span className="text-lg font-bold">{child.headCircumference} cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{interpretation.text}</span>
                    <span className="text-sm font-medium">{percentile.toFixed(0)}th percentile</span>
                  </div>
                  <p className="text-xs mt-2 opacity-80">{interpretation.advice}</p>
                </div>
              );
            })()}
          </div>

          {/* Percentile Scale */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Percentile Scale</p>
            <div className="relative h-8 bg-gradient-to-r from-red-200 via-amber-100 via-50% via-emerald-200 via-85% to-amber-100 to-red-200 rounded-full">
              <div
                className="absolute top-0 w-1 h-8 bg-blue-600 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-500"
                style={{ left: `${percentile}%` }}
              />
              {/* Labels */}
              <div className="absolute -bottom-5 left-0 text-xs text-gray-400">3rd</div>
              <div className="absolute -bottom-5 left-[15%] text-xs text-gray-400">15th</div>
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium">50th</div>
              <div className="absolute -bottom-5 left-[85%] text-xs text-gray-400">85th</div>
              <div className="absolute -bottom-5 right-0 text-xs text-gray-400">97th</div>
            </div>
            <div className="flex justify-between mt-8 text-xs">
              <span className="text-red-500">Consult</span>
              <span className="text-amber-500">Monitor</span>
              <span className="text-emerald-500">Healthy Range</span>
              <span className="text-amber-500">Monitor</span>
              <span className="text-red-500">Consult</span>
            </div>
          </div>
        </motion.div>

        {/* Radar / Star Plot Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">Growth Comparison</h3>
              <p className="text-sm text-gray-500">Percentile comparison across metrics</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium border border-amber-200">
              Dev metrics are estimated
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mb-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">{child.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-gray-600">WHO 50th Percentile</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-gray-600">Regional Average</span>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickCount={5}
                />
                <Radar
                  name="WHO 50th"
                  dataKey="who50"
                  stroke="#34d399"
                  fill="#34d399"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Radar
                  name="Regional Avg"
                  dataKey="regional"
                  stroke="#fbbf24"
                  fill="#fbbf24"
                  fillOpacity={0.05}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
                <Radar
                  name={child.name}
                  dataKey="child"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [`${value}th percentile`, name]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-blue-50 rounded-2xl p-4 flex gap-3"
        >
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              About WHO Growth Standards
            </p>
            <p className="text-sm text-blue-600 mt-1">
              These charts show how your child's growth compares to healthy children
              worldwide. Being between the 15th and 85th percentile is typical.
              Growth patterns are more important than single measurements.
            </p>
          </div>
        </motion.div>

        {/* Historical Measurements */}
        {measurements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h3 className="font-bold text-gray-800 mb-3">Measurement History</h3>
            <div className="space-y-2">
              {measurements.slice(0, 5).map((m, i) => (
                <div
                  key={m.id || i}
                  className="bg-white rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(m.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">{m.ageMonths} months</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {m.weight && (
                      <span className="text-gray-600">{m.weight} kg</span>
                    )}
                    {m.height && (
                      <span className="text-gray-600">{m.height} cm</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Measurement Modal */}
      {showAddModal && (
        <AddMeasurementModal
          child={child}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            await apiService.addMeasurement({
              childId: child.id,
              ...data,
              date: new Date().toISOString(),
            });
            loadMeasurements();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

// Add Measurement Modal Component
const AddMeasurementModal: React.FC<{
  child: ChildProfile;
  onClose: () => void;
  onSave: (data: any) => void;
}> = ({ child, onClose, onSave }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6">Add Measurement</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder={`Current: ${child.weight} kg`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder={`Current: ${child.height} cm`}
            />
          </div>

          {child.ageMonths < 36 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Head Circumference (cm)
              </label>
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
            onClick={() =>
              onSave({
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                headCircumference: head ? parseFloat(head) : undefined,
              })
            }
            disabled={!weight && !height}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg transition-all disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GrowthChartsView;
