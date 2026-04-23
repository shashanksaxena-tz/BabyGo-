import { useState, useEffect } from 'react';
import api from '../api';

export interface DomainConfig {
    key: string;
    label: string;
    emoji: string;
    color: string;
    assessmentKey: string;
    description: string;
}

export interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    severity: number;
}

export interface ScoreThreshold {
    min: number;
    color: string;
    label: string;
}

export interface PercentileThreshold {
    max: number;
    label: string;
    advice: string;
    status: string;
}

export interface TimeFilter {
    id: string;
    label: string;
    days: number | null;
}

export interface AppConfig {
    domains: Record<string, DomainConfig>;
    statuses: Record<string, StatusConfig>;
    scoreThresholds: Record<string, ScoreThreshold>;
    percentileThresholds: PercentileThreshold[];
    timeFilters: TimeFilter[];
    supportedLanguages: { code: string; label: string }[];
    recipeCategories: { id: string; label: string; emoji: string }[];
    regionCuisineMap: Record<string, { name: string; description: string }>;
}

let cachedConfig: AppConfig | null = null;

export function useAppConfig() {
    const [config, setConfig] = useState<AppConfig | null>(cachedConfig);
    const [loading, setLoading] = useState(!cachedConfig);

    useEffect(() => {
        if (cachedConfig) return;
        api.get('/config')
            .then(res => {
                cachedConfig = res.data;
                setConfig(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { config, loading };
}
