import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const supabaseUrl = 'https://cdohoaiqioakaksxkdlu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2hvYWlxaW9ha2Frc3hrZGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyODUzNDAsImV4cCI6MjA1Mjg2MTM0MH0.Ue-uJuAmh0vGKZCCz-OoDo0Wv9WGweFH5KGu7FdHVmg';

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  !supabaseUrl.includes('your-project-ref') &&
  supabaseAnonKey !== 'your_supabase_anon_key';

if (!isSupabaseConfigured) {
  console.warn('Supabase not configured properly. Using mock client.');
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

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