import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase configuration check:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl
  });
  
  // Show user-friendly error instead of throwing
  console.error('CRITICAL: Supabase not configured. Please click "Connect to Supabase" button.');
  
  // Create a mock client that will show helpful errors
  const mockClient = {
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.')),
      insert: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.')),
      update: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.')),
      delete: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.'))
    }),
    auth: {
      signUp: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" button in the top right.')),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {}, unsubscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {}
    })
  };
  
  // @ts-ignore
  export const supabase = mockClient;
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}
