
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config';

interface SystemSettings {
    siteName: string;
    siteLogo: string;
    primaryColor: string;
}

interface SystemContextType {
    settings: SystemSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: 'Zapicar',
        siteLogo: '/logo-dark.png',
        primaryColor: '#25D366'
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/system/settings`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (e) {
            console.error('Failed to fetch system settings', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SystemContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
}
