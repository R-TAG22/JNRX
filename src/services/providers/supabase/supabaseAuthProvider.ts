import { AdminUser } from '../../../types/cms';
import { AuthCredentials, IAuthService } from '../../cms/types';
import { supabase } from '../../../supabaseClient';

const AUTH_SESSION_KEY = 'jnrx_cms_auth_session';

export class SupabaseAuthProvider implements IAuthService {
  private currentUser: AdminUser | null = null;

  constructor() {
    this.currentUser = this.loadSession();
    // Listen to real-time auth changes from Supabase
    if (typeof window !== 'undefined') {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const user: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            name:
              session.user.user_metadata?.full_name ||
              (session.user.email ? session.user.email.split('@')[0] : 'Admin'),
            role: 'superadmin',
            lastLogin: new Date().toISOString(),
          };
          this.currentUser = user;
          this.saveSession(user);
        }
      });
    }
  }

  private loadSession(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem('commerceforge_cms_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private saveSession(user: AdminUser | null) {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  async login(credentials: AuthCredentials): Promise<AdminUser> {
    const email = (credentials.email || '').trim().toLowerCase();
    const password = credentials.password || '';

    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    // Built-in dev team demo bypass
    if (email === 'admin@jnrx.agency' && password === 'devteam2026') {
      const demoUser: AdminUser = {
        id: 'admin-master',
        email: 'admin@jnrx.agency',
        name: 'JNRX Dev Team Admin',
        role: 'superadmin',
        lastLogin: new Date().toISOString(),
      };
      this.currentUser = demoUser;
      this.saveSession(demoUser);
      return demoUser;
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Supabase Auth SignIn
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const authUser = data.user;
    const user: AdminUser = {
      id: authUser?.id || `user-${Date.now()}`,
      email: authUser?.email || email,
      name:
        authUser?.user_metadata?.full_name ||
        email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Admin User',
      role: 'superadmin',
      lastLogin: new Date().toISOString(),
    };

    this.currentUser = user;
    this.saveSession(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    this.currentUser = null;
    this.saveSession(null);
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    if (this.currentUser) {
      return { ...this.currentUser };
    }

    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        const admin: AdminUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || (u.email ? u.email.split('@')[0] : 'Admin'),
          role: 'superadmin',
          lastLogin: new Date().toISOString(),
        };
        this.currentUser = admin;
        this.saveSession(admin);
        return admin;
      }
    } catch {
      // Fallback to loaded session
    }

    this.currentUser = this.loadSession();
    return this.currentUser ? { ...this.currentUser } : null;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      throw new Error('Please enter a valid email to receive password reset instructions.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const supabaseAuthProvider = new SupabaseAuthProvider();
