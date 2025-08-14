import React, { useState } from 'react';
import { User, Mail, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { irishCounties } from '../../../data/counties';
import { AuthFormData } from '../types';

interface AuthStepProps {
  authData: AuthFormData;
  setAuthData: (data: AuthFormData) => void;
  onSuccess: () => void;
}

export default function AuthStep({ authData, setAuthData, onSuccess }: AuthStepProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (authData.email !== authData.confirmEmail) {
          setError('Email addresses do not match');
          return;
        }
        if (authData.password !== authData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!authData.county) {
          setError('Please select your county');
          return;
        }
        
        const { error } = await signUp(authData.email, authData.password, { full_name: authData.fullName });
        if (error) throw error;
        
        onSuccess();
      } else {
        const { error } = await signIn(authData.email, authData.password);
        if (error) throw error;
        
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {authMode === 'signup' ? 'Create Your Account' : 'Sign In to Continue'}
        </h3>
        <p className="text-gray-600">
          {authMode === 'signup' 
            ? 'Create an account to manage your coffee morning campaign'
            : 'Sign in to your existing account'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              required
              value={authData.fullName}
              onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={authData.email}
              onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Confirm Email Address *
              </label>
              <input
                type="email"
                required
                value={authData.confirmEmail}
                onChange={(e) => setAuthData({ ...authData, confirmEmail: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your email address"
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              required
              value={authData.password}
              onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={authData.confirmPassword}
                onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}
        </div>

        {authMode === 'signup' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                County *
              </label>
              <select
                required
                value={authData.county}
                onChange={(e) => setAuthData({ ...authData, county: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Your County</option>
                {irishCounties.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eircode *
              </label>
              <input
                type="text"
                required
                value={authData.eircode}
                onChange={(e) => setAuthData({ ...authData, eircode: e.target.value.toUpperCase() })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="A65 F4E2"
                maxLength={8}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white px-6 py-3 rounded-xl hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue')}
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-600">
          {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
            className="text-green-700 hover:text-green-800 font-medium"
          >
            {authMode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}