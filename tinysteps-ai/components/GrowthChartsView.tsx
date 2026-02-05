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

// WHO Growth Standards Data (simplified for demo)
const WHO_PERCENTILES = {
  weight: {
    boys: {
      p3: [2.5, 3.4, 4.3, 5.0, 5.6, 6.1, 6.5, 6.9, 7.2, 7.5, 7.7, 7.9, 8.1],
      p15: [2.9, 3.9, 4.9, 5.7, 6.3, 6.8, 7.3, 7.7, 8.0, 8.3, 8.6, 8.8, 9.0],
      p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6],
      p85: [3.9, 5.1, 6.3, 7.2, 7.8, 8.4, 8.8, 9.2, 9.6, 9.9, 10.2, 10.5, 10.7],
      p97: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 11.9],
    },
    girls: {
      p3: [2.4, 3.2, 4.0, 4.6, 5.1, 5.5, 5.9, 6.2, 6.5, 6.7, 6.9, 7.1, 7.3],
      p15: [2.8, 3.6, 4.5, 5.2, 5.8, 6.2, 6.6, 6.9, 7.2, 7.5, 7.7, 7.9, 8.1],
      p50: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9],
      p85: [3.7, 4.8, 5.8, 6.6, 7.3, 7.8, 8.2, 8.6, 8.9, 9.2, 9.5, 9.8, 10.0],
      p97: [4.2, 5.5, 6.6, 7.5, 8.2, 8.8, 9.3, 9.7, 10.1, 10.4, 10.7, 11.0, 11.3],
    },
  },
  height: {
    boys: {
      p3: [46.3, 51.1, 54.7, 57.6, 60.0, 62.0, 63.8, 65.4, 66.9, 68.2, 69.5, 70.7, 71.8],
      p15: [48.0, 53.0, 56.7, 59.7, 62.2, 64.3, 66.1, 67.8, 69.3, 70.7, 72.0, 73.2, 74.3],
      p50: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7],
      p85: [51.8, 56.5, 60.2, 63.2, 65.7, 67.6, 69.2, 70.7, 72.1, 73.4, 74.6, 75.8, 77.0],
      p97: [53.4, 58.1, 61.7, 64.6, 67.0, 68.9, 70.4, 71.9, 73.2, 74.5, 75.7, 76.9, 78.1],
    },
    girls: {
      p3: [45.6, 50.0, 53.2, 55.8, 57.9, 59.8, 61.5, 63.0, 64.4, 65.7, 66.9, 68.1, 69.2],
      p15: [47.2, 51.7, 55.1, 57.8, 60.0, 61.9, 63.6, 65.2, 66.6, 67.9, 69.2, 70.4, 71.5],
      p50: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0],
      p85: [51.1, 55.8, 59.2, 61.9, 64.3, 66.2, 67.9, 69.5, 70.9, 72.3, 73.7, 75.1, 76.4],
      p97: [52.7, 57.4, 60.9, 63.6, 66.0, 67.9, 69.6, 71.2, 72.7, 74.1, 75.5, 76.9, 78.3],
    },
  },
  head: {
    boys: {
      p3: [32.1, 35.1, 36.9, 38.3, 39.4, 40.3, 41.0, 41.7, 42.2, 42.7, 43.1, 43.5, 43.8],
      p15: [33.2, 36.1, 38.0, 39.3, 40.4, 41.2, 41.9, 42.5, 43.1, 43.5, 43.9, 44.3, 44.6],
      p50: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1],
      p85: [35.8, 38.5, 40.3, 41.7, 42.8, 43.9, 44.7, 45.4, 46.0, 46.5, 46.9, 47.3, 47.6],
      p97: [36.9, 39.5, 41.3, 42.7, 43.8, 44.9, 45.8, 46.5, 47.1, 47.6, 48.1, 48.5, 48.8],
    },
    girls: {
      p3: [31.7, 34.3, 36.0, 37.2, 38.2, 39.0, 39.7, 40.3, 40.8, 41.2, 41.6, 41.9, 42.2],
      p15: [32.7, 35.3, 37.0, 38.2, 39.2, 40.0, 40.7, 41.3, 41.8, 42.2, 42.6, 42.9, 43.2],
      p50: [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9],
      p85: [35.1, 37.8, 39.5, 40.8, 41.9, 42.9, 43.7, 44.4, 44.9, 45.4, 45.9, 46.3, 46.6],
      p97: [36.1, 38.8, 40.5, 41.9, 43.0, 44.1, 44.9, 45.6, 46.2, 46.7, 47.2, 47.6, 48.0],
    },
  },
};

const GrowthChartsView: React.FC<GrowthChartsViewProps> = ({ child, onBack }) => {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [showAddModal, setShowAddModal] = useState(false);
  const [percentile, setPercentile] = useState<number>(50);

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
        if (selectedMetric === 'weight') {
          setPercentile(data.weightPercentile || 50);
        } else if (selectedMetric === 'height') {
          setPercentile(data.heightPercentile || 50);
        } else {
          setPercentile(data.headCircumferencePercentile || 50);
        }
      }
    } catch (error) {
      console.error('Failed to calculate percentile:', error);
    }
  };

  const getChartData = () => {
    const genderKey = child.gender === 'female' ? 'girls' : 'boys';
    const metricData = WHO_PERCENTILES[selectedMetric]?.[genderKey];
    if (!metricData) return [];

    const data = [];
    const maxMonths = Math.min(child.ageMonths + 3, 12);

    for (let month = 0; month <= maxMonths; month++) {
      const dataPoint: any = {
        month,
        p3: metricData.p3[month],
        p15: metricData.p15[month],
        p50: metricData.p50[month],
        p85: metricData.p85[month],
        p97: metricData.p97[month],
      };

      // Add child's measurement at current age
      if (month === child.ageMonths) {
        dataPoint.child =
          selectedMetric === 'weight'
            ? child.weight
            : selectedMetric === 'height'
            ? child.height
            : child.headCircumference;
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

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
