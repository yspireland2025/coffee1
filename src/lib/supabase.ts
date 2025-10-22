import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration:');
console.log('- URL from env:', supabaseUrl);
console.log('- Key present:', !!supabaseAnonKey);

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseAnonKey !== 'your_supabase_anon_key';

if (!isSupabaseConfigured) {
  console.error('Supabase not configured properly!');
  console.error('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.error('VITE_SUPABASE_ANON_KEY present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  throw new Error('Supabase environment variables not configured. Please restart the dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock Supabase client for when not configured
function createMockClient() {
  const mockResponse = { data: [], error: null };
  
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(mockResponse)
        }),
        order: () => Promise.resolve(mockResponse)
      }),
      insert: () => ({
        select: () => Promise.resolve(mockResponse)
      }),
      update: () => ({
        eq: () => Promise.resolve(mockResponse)
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: { message: 'Supabase not configured' } })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {}, unsubscribe: () => {} })
    })
  };
}