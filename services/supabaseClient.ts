
import { createClient } from '@supabase/supabase-js';

// Helper to get config from local storage (for dynamic configuration in Admin Panel)
const getSupabaseConfig = () => {
    const url = localStorage.getItem('devterm_supabase_url');
    const key = localStorage.getItem('devterm_supabase_key');
    return { url, key };
};

const { url, key } = getSupabaseConfig();

// Initialize the client if keys are present
// This allows the app to start even without keys (falling back to local state)
export const supabase = (url && key) 
    ? createClient(url, key) 
    : null;

export const isSupabaseConfigured = () => !!supabase;

export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('devterm_supabase_url', url);
    localStorage.setItem('devterm_supabase_key', key);
    // Force reload to re-initialize client
    window.location.reload();
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('devterm_supabase_url');
    localStorage.removeItem('devterm_supabase_key');
    window.location.reload();
};
