import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  user_metadata?: any;
  app_metadata?: any;
  created_at: string;
  last_sign_in_at: string | null;
}

export function useAdmin() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);

  // Session timeout duration (60 minutes)
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout

  useEffect(() => {
    // Check for existing admin session on app start
    const checkExistingSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && (user.email === 'admin@yspi.ie' || user.user_metadata?.role === 'admin')) {
          const formattedUser = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || '',
            role: user.user_metadata?.role || 'admin',
            user_metadata: user.user_metadata || {},
            app_metadata: user.app_metadata || {},
            created_at: user.created_at || new Date().toISOString(),
            last_sign_in_at: user.last_sign_in_at
          };
          setAdminUser(formattedUser);
          console.log('Admin session restored:', formattedUser);
          startSessionTimer();
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingSession();

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (session.user.email === 'admin@yspi.ie' || session.user.user_metadata?.role === 'admin')) {
        const formattedUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email || '',
          role: session.user.user_metadata?.role || 'admin',
          user_metadata: session.user.user_metadata || {},
          app_metadata: session.user.app_metadata || {},
          created_at: session.user.created_at || new Date().toISOString(),
          last_sign_in_at: session.user.last_sign_in_at
        };
        setAdminUser(formattedUser);
        startSessionTimer();
      } else {
        setAdminUser(null);
        clearSessionTimer();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const startSessionTimer = () => {
    // Clear any existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
    }

    // Set warning timer for 55 minutes (5 minutes before logout)
    const warnTimer = setTimeout(() => {
      console.log('Admin session warning: 5 minutes until automatic logout');
      
      // Show warning notification
      const warningToast = document.createElement('div');
      warningToast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm';
      warningToast.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">⏰</div>
          <div>
            <p class="font-medium">Session Expiring Soon</p>
            <p class="text-sm mt-1">Your admin session will expire in 5 minutes. Click anywhere to extend your session.</p>
          </div>
        </div>
      `;
      document.body.appendChild(warningToast);
      
      // Auto-remove warning after 30 seconds
      setTimeout(() => {
        if (document.body.contains(warningToast)) {
          document.body.removeChild(warningToast);
        }
      }, 30000);
    }, SESSION_TIMEOUT - WARNING_TIME);

    setWarningTimer(warnTimer);

    // Set logout timer for 60 minutes
    const timer = setTimeout(() => {
      console.log('Admin session expired after 60 minutes');
      adminLogout();
      
      // Show session expired notification
      const expiredToast = document.createElement('div');
      expiredToast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50';
      expiredToast.innerHTML = '⏰ Admin session expired. Please log in again.';
      document.body.appendChild(expiredToast);
      setTimeout(() => {
        if (document.body.contains(expiredToast)) {
          document.body.removeChild(expiredToast);
        }
      }, 5000);
    }, SESSION_TIMEOUT);

    setSessionTimer(timer);
  };

  const clearSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      setWarningTimer(null);
    }
  };

  // Reset session timer on user activity
  const resetSessionTimer = () => {
    if (adminUser) {
      startSessionTimer();
    }
  };

  // Add activity listeners to reset timer
  useEffect(() => {
    if (adminUser) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const resetTimer = () => {
        resetSessionTimer();
      };

      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetTimer, true);
        });
      };
    }
  }, [adminUser]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearSessionTimer();
    };
  }, []);

  const adminLogin = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      console.log('Attempting admin login for:', credentials.email);
      
      // Use Supabase auth directly for admin login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error || !data.user) {
        console.error('Admin login error:', error?.message);
        return false;
      }

      // Format user data
      const user = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || data.user.email || '',
        role: data.user.user_metadata?.role || 'admin',
        user_metadata: data.user.user_metadata || {},
        app_metadata: data.user.app_metadata || {},
        created_at: data.user.created_at || new Date().toISOString(),
        last_sign_in_at: data.user.last_sign_in_at
      };

      // Check if user is admin (for now, allow admin@yspi.ie or check metadata)
      if (user.email === 'admin@yspi.ie' || user.role === 'admin' || user.role === 'super_admin') {
        setAdminUser(user);
        startSessionTimer();
        console.log('Admin login successful');
        return true;
      } else {
        console.log('User is not an admin, signing out');
        await supabase.auth.signOut();
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = async () => {
    try {
      clearSessionTimer();
      await supabase.auth.signOut();
      setAdminUser(null);
      console.log('Admin logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if logout fails
      clearSessionTimer();
      setAdminUser(null);
    }
  };

  return {
    adminUser,
    loading,
    adminLogin,
    adminLogout,
    resetSessionTimer,
    isAdmin: !!adminUser
  };
}