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
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface SignUpViewProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
  onSignUpSuccess?: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  onNavigateToLogin,
  onNavigateToHome,
  onSignUpSuccess,
}) => {
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    confirmationRequired?: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    const { error, confirmationRequired } = await signUp(cleanName, cleanEmail, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    } else {
      if (confirmationRequired) {
        setSuccessInfo({
          confirmationRequired: true,
          message:
            'Account registration initiated! A verification link has been dispatched to your email address. Please confirm your email to activate your account.',
        });
      } else {
        setSuccessInfo({
          confirmationRequired: false,
          message: 'Account created and verified! Welcome to Virasat Quest.',
        });
        if (onSignUpSuccess) {
          onSignUpSuccess();
        } else {
          setTimeout(() => onNavigateToHome(), 1200);
        }
      }
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
            Create Researcher Account
          </h1>
          <p className="text-xs text-[#777267] max-w-sm mx-auto">
            Join the open cultural preservation community to bookmark heritage sites, annotate folios, and access archival tools.
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
                Supabase credentials are not set in the local environment. Public heritage archives and the knowledge graph remain fully accessible without registration.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Info Alert */}
          {successInfo && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Registration Submitted</span>
              </div>
              <p className="leading-relaxed text-[11px]">{successInfo.message}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors"
                >
                  Proceed to Sign In &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {!successInfo && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Ananya Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-[#292821] placeholder-[#777267] focus:bg-white focus:ring-2 focus:ring-[#B65F43] focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-email"
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
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold text-[#292821] mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#777267] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-[#292821] placeholder-[#777267] focus:bg-white focus:ring-2 focus:ring-[#B65F43] focus:outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777267] hover:text-[#292821]"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="text-[11px] flex items-center gap-1.5 pt-0.5">
                  {password === confirmPassword ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#B65F43] hover:bg-[#9A4B32] transition-colors shadow-xs disabled:opacity-50 cursor-pointer pt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Researcher Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-[#DCC9AD]/40 text-center text-xs text-[#777267]">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-[#B65F43] hover:underline"
            >
              Sign In
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

export default SignUpView;
