import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

export interface Child {
    _id: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    weight: number;
    height: number;
    headCircumference?: number;
    region?: string;
    nickname?: string;
    interests?: string[];
    favoriteCharacters?: string[];
    favoriteToys?: string[];
    favoriteColors?: string[];
    profilePhotoUrl?: string;
    achievedMilestones?: {
        milestoneId: string;
        achievedDate: string;
        confirmedBy: 'parent' | 'analysis';
        notes?: string;
    }[];
    watchedMilestones?: {
        milestoneId: string;
        addedDate: string;
    }[];
    ageInMonths?: number;
    displayAge?: string;
}

interface ChildContextType {
    children: Child[];
    activeChild: Child | null;
    loading: boolean;
    setActiveChildId: (id: string) => void;
    refreshChildren: () => Promise<Child[]>;
}

const ChildContext = createContext<ChildContextType>({
    children: [],
    activeChild: null,
    loading: true,
    setActiveChildId: () => { },
    refreshChildren: async () => [],
});

export const useChild = () => useContext(ChildContext);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [kids, setKids] = useState<Child[]>([]);
    const [activeChildId, setActiveChildIdState] = useState<string | null>(
        localStorage.getItem('activeChild')
    );
    const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
        localStorage.getItem('token') ? 'loading' : 'idle'
    );
    const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);

    // Strictly derived loading state mapping user to fetched state
    // Prevents momentarily returning loading: false before API finishes
    const loading = user ? (lastFetchedUserId !== user.id || fetchStatus === 'loading') : false;

    const fetchChildren = async (): Promise<Child[]> => {
        if (!user) {
            setKids([]);
            setActiveChildIdState(null);
            setFetchStatus('success');
            return [];
        }

        setFetchStatus('loading');
        try {
            const response = await api.get('/children');
            const data = response.data.children || [];
            setKids(data);
            setLastFetchedUserId(user.id);

            if (data.length > 0) {
                if (!activeChildId || !data.find((c: Child) => c._id === activeChildId)) {
                    setActiveChildIdState(data[0]._id);
                    localStorage.setItem('activeChild', data[0]._id);
                }
            } else {
                setActiveChildIdState(null);
            }
            setFetchStatus('success');
            return data;
        } catch (error) {
            console.error('Error fetching children', error);
            setFetchStatus('error');
            return [];
        }
    };

    useEffect(() => {
        fetchChildren();
    }, [user?.id]);

    const setActiveChildId = (id: string) => {
        setActiveChildIdState(id);
        localStorage.setItem('activeChild', id);
    };

    const activeChild = kids.find(c => c._id === activeChildId) || null;

    return (
        <ChildContext.Provider value={{ children: kids, activeChild, loading, setActiveChildId, refreshChildren: fetchChildren }}>
            {children}
        </ChildContext.Provider>
    );
};
