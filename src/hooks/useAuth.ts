import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/authService';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  // Session timeout duration (15 minutes for users)
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  const clearSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
  };

  const signOut = async () => {
    // Always clear local state first
    setUser(null);
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }

    // Clear auth service session
    await authService.logout();

    return { error: null };
  };

  const startSessionTimer = () => {
    // Clear any existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    // Set new timer for 15 minutes
    const timer = setTimeout(() => {
      console.log('User session expired after 15 minutes');
      signOut();

      // Show session expired notification
      const expiredToast = document.createElement('div');
      expiredToast.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50';
      expiredToast.innerHTML = '⏰ Your session has expired. Please sign in again to continue.';
      document.body.appendChild(expiredToast);
      setTimeout(() => {
        if (document.body.contains(expiredToast)) {
          document.body.removeChild(expiredToast);
        }
      }, 5000);
    }, SESSION_TIMEOUT);

    setSessionTimer(timer);
  };

  // Reset session timer on user activity
  const resetSessionTimer = () => {
    if (authService.getCurrentUser()) {
      startSessionTimer();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);

          if (currentUser) {
            startSessionTimer();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes from our custom auth service
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (mounted) {
        setUser(user);
        if (user) {
          startSessionTimer();
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, []);

  // Add activity listeners to reset timer
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keypress', 'click'];

      const resetTimer = () => {
        if (authService.getCurrentUser()) {
          startSessionTimer();
        }
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
  }, [user]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('Attempting to sign up user:', email);
    
    const { user: newUser, error } = await authService.register(
      email, 
      password, 
      metadata?.full_name || 'User',
      metadata?.county,
      metadata?.eircode
    );
    
    if (error) {
      console.error('Sign up error:', error);
      return { data: { user: null }, error: { message: error } };
    } else {
      console.log('Sign up successful:', newUser);
      setUser(newUser);
      if (newUser) {
        startSessionTimer();
      }
      return { data: { user: newUser }, error: null };
    }
  }

  const signIn = async (email: string, password: string) => {
    const { user: loggedInUser, error } = await authService.login(email, password);
    if (error) {
      return { data: { user: null }, error: { message: error } };
    } else {
      setUser(loggedInUser);
      if (loggedInUser) {
        startSessionTimer();
      }
      return { data: { user: loggedInUser }, error: null };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error as Error };
    }
  };

  const refreshSessionIfNeeded = async () => {
    // Supabase handles session refresh automatically
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && this.user) {
      // User session was cleared, sign out
      await signOut();
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSessionIfNeeded,
    resetSessionTimer
  };
}