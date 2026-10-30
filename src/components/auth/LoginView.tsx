/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface LoginViewProps {
  onNavigateToSignUp: () => void;
  onNavigateToHome: () => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateToSignUp,
  onNavigateToHome,
  onLoginSuccess,
}) => {
  const { signIn, resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password flow state
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(cleanEmail, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSuccessMessage('Signed in successfully.');
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        setTimeout(() => onNavigateToHome(), 800);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetFeedback(null);

    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      setResetError('Please enter the email address registered with your account.');
      return;
    }

    setResetLoading(true);
    const { error, message } = await resetPassword(cleanEmail);
    setResetLoading(false);

    if (error) {
      setResetError(error);
    } else {
      setResetFeedback(
        message || 'Password reset instructions have been sent to your email.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8F5EF]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 transition-transform hover:scale-105"
            aria-label="Virasat Quest Home"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B65F43] text-white shadow-xs">
              <Compass className="h-6 w-6 stroke-[1.8]" />
            </div>
          </button>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#292821]">
            Sign In to Virasat Quest
          </h1>
          <p className="text-xs text-[#777267] max-w-sm mx-auto">
            Access your research passport, view private archival notes, and sync saved heritage monuments.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#DCC9AD] rounded-2xl sm:px-10">
          {!isConfigured && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Supabase Configuration Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Supabase credentials are not set in the local environment. Public heritage archives and the knowledge graph remain fully accessible without logging in.
              </p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Standard Login Form */}
          {!isForgotPasswordMode ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="historian@university.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-[#292821] placeholder-[#777267] focus:bg-white focus:ring-2 focus:ring-[#B65F43] focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#292821]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(true);
                      setResetEmail(email);
                      setErrorMessage(null);
                    }}
                    className="text-xs font-medium text-[#B65F43] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-[#292821] placeholder-[#777267] focus:bg-white focus:ring-2 focus:ring-[#B65F43] focus:outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777267] hover:text-[#292821]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#B65F43] hover:bg-[#9A4B32] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Repository</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Flow */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-serif font-bold text-[#292821] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#B65F43]" />
                  <span>Reset Account Password</span>
                </span>
                <p className="text-[11px] text-[#777267] leading-relaxed">
                  Enter your registered email address and we will dispatch password recovery instructions.
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {resetError}
                </div>
              )}

              {resetFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetFeedback}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="historian@university.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-[#292821] focus:bg-white focus:ring-2 focus:ring-[#B65F43] focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(false)}
                  className="text-xs text-[#777267] hover:text-[#292821] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {resetLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Send Reset Email</span>
                </button>
              </div>
            </form>
          )}

          {/* Switch to Sign Up */}
          <div className="mt-6 pt-5 border-t border-[#DCC9AD]/40 text-center text-xs text-[#777267]">
            <span>Don&apos;t have an account yet? </span>
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="font-bold text-[#B65F43] hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="text-xs text-[#777267] hover:text-[#292821] inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Virasat Quest Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
