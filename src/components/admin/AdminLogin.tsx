import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<boolean>;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await onLogin({ email, password });
      if (!success) {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/#admin`
      });

      const result = await Promise.race([resetPromise, timeoutPromise]) as any;

      if (result.error) throw result.error;

      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.message === 'Request timeout') {
        setError('The request took too long. This is a known issue with the authentication service. Please try again or contact support.');
      } else if (err.message?.includes('email rate limit exceeded')) {
        setError('Too many password reset attempts. Please wait 5-10 minutes before trying again.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetSuccess(false);
    setResetEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
          <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {showForgotPassword ? 'Reset Password' : 'YSPI Admin Portal'}
          </h1>
          <p className="text-blue-100">
            {showForgotPassword ? 'Admin Password Recovery' : 'Secure Administration Access'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {showForgotPassword ? (
            resetSuccess ? (
              <div className="text-center py-8">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{resetEmail}</strong>. 
                  Click the link in the email to reset your admin password.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="text-blue-700 hover:text-blue-800 font-medium flex items-center space-x-2 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@yspi.ie"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your admin email to receive a password reset link
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {resetLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-blue-700 hover:text-blue-800 font-medium text-sm flex items-center space-x-2 mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@yspi.ie"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? 'Authenticating...' : 'Access Admin Portal'}
              </button>
            </form>
          )}

          {!showForgotPassword && (
            <div className="mt-6 text-center space-y-4">
              <div>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-700 hover:text-blue-800 font-medium text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-xs">
                ⏰ Admin sessions expire after 60 minutes of inactivity for security
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Authorized personnel only. All access is logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}