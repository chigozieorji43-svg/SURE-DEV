import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Github, LogIn, AlertCircle, Loader } from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';
import { 
  auth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  isFirebaseConfigured,
  sendPasswordResetEmail
} from '../lib/firebase';
import { dbService } from '../lib/firebaseService';
import { authLogger } from '../utils/authLogger';
import { googleAuthManager } from '../lib/googleAuthHelper';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, accountType?: string, isGoogleUser?: boolean, displayName?: string, avatar?: string) => void;
  onOpenJoin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, onOpenJoin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      authLogger.info('[LoginModal] Google Sign-In initiated');

      if (!auth) {
        throw new Error('Firebase Auth service is not initialized. Please refresh the page.');
      }

      // Use the enhanced Google Auth Manager
      const result = await googleAuthManager.signInWithGoogle(auth);

      if (!result?.user) {
        throw new Error('Failed to authenticate with Google. Please try again.');
      }

      const googleUser = result.user;
      authLogger.success('[LoginModal] Google user authenticated', {
        email: googleUser.email,
        uid: googleUser.uid,
      });

      // Fetch or create user document
      const userDoc = await dbService.getUserDoc(googleUser.uid, googleUser.email || '');

      if (userDoc && (userDoc.role || userDoc.accountType)) {
        // Existing Google user with assigned role
        const role = userDoc.role || userDoc.accountType;
        authLogger.success('[LoginModal] Existing Google user found with role:', role);

        onLoginSuccess(
          googleUser.email || '',
          role,
          true,
          googleUser.displayName || undefined,
          googleUser.photoURL || undefined
        );
        onClose();
      } else {
        // New Google user - they'll be prompted to select role by GoogleRoleSelectorModal
        authLogger.info('[LoginModal] New Google user detected - role selector will be shown');
        onClose();
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Google Sign-In failed. Please try again.';
      authLogger.error('[LoginModal] Google Sign-In error:', error);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      authLogger.info('[LoginModal] Email/password login initiated for:', email);

      if (!auth) {
        throw new Error('Firebase Auth service is not initialized.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      authLogger.success('[LoginModal] Email/password login successful');

      // Fetch user document from Firestore
      const userDoc = await dbService.getUserDoc(firebaseUser.uid, firebaseUser.email || '');

      if (userDoc && (userDoc.role || userDoc.accountType)) {
        const role = userDoc.role || userDoc.accountType;
        onLoginSuccess(
          firebaseUser.email || '',
          role,
          false,
          firebaseUser.displayName || undefined,
          firebaseUser.photoURL || undefined
        );
        onClose();
      } else {
        setErrorMessage('Account found but role not assigned. Please contact support.');
        authLogger.error('[LoginModal] User has no assigned role');
      }
    } catch (error: any) {
      authLogger.error('[LoginModal] Email/password login failed:', error);

      if (error?.code === 'auth/user-not-found') {
        setErrorMessage('Email not found. Please sign up or check your email.');
      } else if (error?.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else if (error?.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address.');
      } else if (error?.code === 'auth/user-disabled') {
        setErrorMessage('This account has been disabled. Contact support.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed login attempts. Please try again later.');
      } else {
        setErrorMessage(error?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!forgotPasswordEmail) {
      setErrorMessage('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    try {
      authLogger.info('[LoginModal] Password reset requested for:', forgotPasswordEmail);

      if (!auth) {
        throw new Error('Firebase Auth service is not initialized.');
      }

      await sendPasswordResetEmail(auth, forgotPasswordEmail);

      authLogger.success('[LoginModal] Password reset email sent');
      setForgotPasswordSent(true);
      setTimeout(() => {
        setIsForgotPasswordMode(false);
        setForgotPasswordEmail('');
        setForgotPasswordSent(false);
      }, 3000);
    } catch (error: any) {
      authLogger.error('[LoginModal] Password reset failed:', error);

      if (error?.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.');
      } else if (error?.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please try again later.');
      } else {
        setErrorMessage(error?.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-midnight to-brand-green p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={suredevBrandLogo} alt="SureDev" className="w-8 h-8 rounded" />
            <h2 className="text-lg font-bold">Sign In to SureDev</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {isForgotPasswordMode ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader size={20} className="animate-spin" /> : <Mail size={20} />}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {forgotPasswordSent && (
                <p className="text-green-600 text-sm font-medium text-center">
                  ✅ Check your email for the reset link!
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(false);
                  setForgotPasswordEmail('');
                  setErrorMessage(null);
                }}
                className="w-full text-center text-brand-green hover:underline font-medium text-sm"
              >
                Back to Login
              </button>
            </form>
          ) : (
            // Main Login Form
            <>
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !isFirebaseConfigured}
                className="w-full py-3 px-4 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>

              <div className="relative flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-3 text-gray-500 text-sm font-medium">Or</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader size={20} className="animate-spin" /> : <LogIn size={20} />}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsForgotPasswordMode(true)}
                className="w-full text-center text-brand-green hover:underline font-medium text-sm"
              >
                Forgot Password?
              </button>
            </>
          )}

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  onClose();
                  onOpenJoin();
                }}
                className="text-brand-green font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
