
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface ProfileRow {
    id: string;
    full_name: string | null;
    organization: string | null;
    phone: string | null;
    has_completed_audit: boolean;
    last_audit_score: number | null;
    directors_notes: string | null;
    is_admin: boolean;
    is_bdm: boolean;
    assigned_expert_id: string | null;
    updated_at: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    profile: ProfileRow | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    profile: null,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [profile, setProfile] = useState<ProfileRow | null>(null);

    const fetchProfile = async (userId: string) => {
        if (!supabase) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            setProfile(data as ProfileRow);
            setIsAdmin(data.is_admin ?? false);
        }
    };

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setProfile(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isAdmin, profile, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
