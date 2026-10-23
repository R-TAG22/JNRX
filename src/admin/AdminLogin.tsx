import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, HelpCircle, X, CheckCircle2, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { useRouter } from './router';
import { useToast } from './components/Toast';
import { supabase } from '../supabaseClient';

export const AdminLogin: React.FC = () => {
  const { login } = useCMS();
  const { currentPath, navigate } = useRouter();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    return currentPath === '/admin/signup' ? 'signup' : 'signin';
  });

  useEffect(() => {
    if (currentPath === '/admin/signup') {
      setMode('signup');
    } else if (currentPath === '/admin/login') {
      setMode('signin');
    }
  }, [currentPath]);

  const [email, setEmail] = useState('admin@jnrx.agency');
  const [password, setPassword] = useState('devteam2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    if (newMode === 'signup') {
      if (email === 'admin@jnrx.agency') {
        setEmail('');
        setPassword('');
      }
      setConfirmPassword('');
    } else {
      if (!email) {
        setEmail('admin@jnrx.agency');
        setPassword('devteam2026');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Validate password match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        // 1. Supabase Admin SignUp
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        // 2. Establish CMS session
        await login({ email, password });
        if (data?.user && !data?.session) {
          showToast('success', 'Admin Account Created', 'Account created! (If email confirmation is enabled, check your inbox)');
        } else {
          showToast('success', 'Admin Account Created', 'Welcome to JNRX CMS Dashboard!');
        }
        navigate('/admin');
      } else {
        // Sign In mode
        if (email === 'admin@jnrx.agency' && password === 'devteam2026') {
          // Built-in demo credentials bypass
          await login({ email, password });
          showToast('success', 'Welcome Back', 'Logged into JNRX CMS Dashboard.');
          navigate('/admin');
          return;
        }

        // 1. Supabase Auth signIn
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        // 2. Login to CMS session
        await login({ email, password });
        showToast('success', 'Welcome Back', 'Logged into JNRX CMS Dashboard.');
        navigate('/admin');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setForgotSuccess(true);
      showToast('info', 'Password Reset Sent', 'Check your inbox for reset instructions.');
    } catch {
      // handled
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F1F5F9] text-slate-900 admin-cms">
      {/* Top Bar with Back to Public Site */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3.5 py-2 rounded-xl border bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs cursor-pointer transition-colors"
        >
          <span>← Back to Website</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {mode === 'signup' ? 'Admin Registration' : 'Secure Admin Portal'}
          </span>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 my-12">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-2">
            <img
              src="/JNRX-Logo.jpeg"
              alt="JNRX Logo"
              className="w-full h-full object-contain mix-blend-multiply"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
            JNR<span className="text-emerald-600">X</span> CMS
          </h1>
          <p className="text-xs font-bold tracking-wider uppercase mt-1 text-slate-500">
            Website Content Management System
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl mb-4 shadow-inner">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Sign Up</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 shadow-xl text-slate-900">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {mode === 'signup' ? 'Admin Sign Up' : 'Admin Sign In'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'signup'
                  ? 'Register a new administrator account for JNRX CMS'
                  : 'Enter your credentials to edit website content'}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full border border-emerald-300 text-[10px] font-bold flex items-center gap-1.5 bg-emerald-50 text-emerald-800">
              {mode === 'signup' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Admin</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Admin</span>
                </>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-800">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'signup' ? 'newadmin@jnrx.agency' : 'admin@jnrx.agency'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold transition-all focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotSuccess(false);
                      setForgotEmail(email);
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold transition-all focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-800">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold transition-all focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 rounded-xl bg-[#B7E84B] hover:bg-[#a6d83b] text-[#0E1B13] text-xs font-black uppercase tracking-[0.14em] shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>{mode === 'signup' ? 'Creating account...' : 'Verifying credentials...'}</span>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Admin Account' : 'Sign In To Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switch Helper */}
          <div className="mt-5 text-center">
            {mode === 'signin' ? (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Need an admin account? <span className="text-emerald-700 font-bold underline">Sign Up Here</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Already have an admin account? <span className="text-emerald-700 font-bold underline">Sign In Here</span>
              </button>
            )}
          </div>

          {/* Credentials Helper Pill */}
          {mode === 'signin' && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-xl">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-900">
                  Pre-filled Credentials:{' '}
                </span>
                Click <strong>Sign In To Dashboard</strong> directly to access all website editors.
              </div>
            </div>
          )}
        </div>

        {/* Back to Public Site Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
          >
            ← Return To Public Website
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Reset Admin Password</h3>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Password Reset Dispatched</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Instructions to reset your admin password have been sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-[#B7E84B] text-[#0E1B13] text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter your registered admin email address and we'll dispatch password recovery instructions.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@jnrx.agency"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2 rounded-xl bg-[#B7E84B] text-[#0E1B13] text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

