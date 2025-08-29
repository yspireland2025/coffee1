import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-project-ref') || 
    supabaseAnonKey.includes('your-anon-key')) {
  console.error('CRITICAL: Supabase not configured. Please click "Connect to Supabase" button in the top right.');
  throw new Error('Supabase configuration missing. Please connect to Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
