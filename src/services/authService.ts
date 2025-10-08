import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  app_metadata?: {
    role?: string;
  };
  full_name?: string;
  role?: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  private initialized = false;

  constructor() {
    this.initializeAuth().catch(error => {
      console.error('Auth initialization error:', error);
    });
  }

  private async initializeAuth() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = this.formatUser(session.user);
        this.notifyAuthStateChange(this.currentUser);
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
    }

    // Listen for auth changes
    try {
      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          this.currentUser = this.formatUser(session.user);
          this.notifyAuthStateChange(this.currentUser);
        } else {
          this.currentUser = null;
          this.notifyAuthStateChange(null);
        }
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }
  }

  private formatUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.user_metadata?.full_name || userData.email,
      role: userData.app_metadata?.role || 'user',
      user_metadata: userData.user_metadata || {},
      app_metadata: userData.app_metadata || {},
      created_at: userData.created_at || new Date().toISOString(),
      last_sign_in_at: userData.last_sign_in_at
    };
  }

  private notifyAuthStateChange(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<{ user?: User; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        this.currentUser = this.formatUser(data.user);
        return { user: this.currentUser };
      }

      return { error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Network error. Please try again.' };
    }
  }

  async register(email: string, password: string, fullName: string, county?: string, eircode?: string): Promise<{ user?: User; error?: string }> {
    try {
      console.log('AuthService: Starting registration process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            county: county,
            eircode: eircode
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('AuthService: Supabase auth user created successfully');

        this.currentUser = this.formatUser(data.user);
        return { user: this.currentUser };
      }

      return { error: 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { error: error.message || 'Network error. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Check if this is the "session not found" error which is expected when session is already expired
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && 
          error.message.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('Session already expired on server, user logged out locally');
      } else {
        console.error('Logout error:', error);
      }
    }
    this.currentUser = null;
    this.notifyAuthStateChange(null);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return {};
    } catch (error: any) {
      console.error('Change password error:', error);
      return { error: error.message || 'Failed to change password' };
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
  }

  isUserAdmin(user: User | null): boolean {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }
}

export const authService = new AuthService();
export type { LoginCredentials, RegisterData };