'use client';

import { supabase } from './supabase';

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar_url?: string;
    signature_url?: string;
    home_city?: string;
}

export const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) return { error: error.message };

    // Force a reload or storage event? Supabase handles session automagically usually.
    // But for our store to pick it up, we might just rely on the session listener in layout.
    return { error: null };
};

export const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
};

/**
 * Gets the current user from the local Supabase session.
 * CAUTION: This might be null if session hasn't loaded yet.
 * For reactive UI, use the user state from TripStore.
 */
export const getUser = (): User | null => {
    return null;
};

/**
 * Async helper to get full user profile including role
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch profile for role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, name, avatar_url, signature_url, home_city')
        .eq('id', user.id) // Corrected: primary key in profiles is 'id' which matches auth.users.id
        .single();

    return {
        id: user.id,
        email: user.email!,
        name: profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
        role: profile?.role || 'user',
        avatar_url: profile?.avatar_url,
        signature_url: profile?.signature_url,
        home_city: profile?.home_city
    };
};
