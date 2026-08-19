import { GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { authLogger } from '../utils/authLogger';

// Enhanced Google Auth Provider with robust error handling
export class GoogleAuthManager {
  private provider: GoogleAuthProvider;

  constructor() {
    this.provider = new GoogleAuthProvider();
    this.configureProvider();
  }

  private configureProvider(): void {
    // Request specific scopes for Gmail access
    this.provider.addScope('profile');
    this.provider.addScope('email');
    
    // Set custom parameters for better UX
    this.provider.setCustomParameters({
      prompt: 'select_account', // Always show account selection
      access_type: 'offline',    // Request refresh token
    });

    authLogger.info('[GoogleAuthManager] Provider configured with scopes: profile, email');
  }

  async signInWithGoogle(auth: Auth | null): Promise<any> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    try {
      authLogger.info('[GoogleAuthManager] Initiating Google Sign-In popup...');
      
      const result = await signInWithPopup(auth, this.provider);
      
      authLogger.success('[GoogleAuthManager] Google Sign-In successful', {
        email: result.user.email,
        uid: result.user.uid,
      });

      return result;
    } catch (error: any) {
      authLogger.error('[GoogleAuthManager] Google Sign-In failed', error);
      return this.handleGoogleAuthError(error);
    }
  }

  private handleGoogleAuthError(error: any): never {
    const errorCode = error?.code;
    const errorMessage = error?.message || 'Unknown error';

    let userFriendlyMessage = 'Google Sign-In failed. Please try again.';

    switch (errorCode) {
      case 'auth/popup-blocked':
        userFriendlyMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
        authLogger.error('[GoogleAuthManager] Pop-up blocked by browser');
        break;

      case 'auth/popup-closed-by-user':
        userFriendlyMessage = 'Sign-in was cancelled. Please try again.';
        authLogger.warn('[GoogleAuthManager] User closed pop-up');
        break;

      case 'auth/network-request-failed':
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
        authLogger.error('[GoogleAuthManager] Network failure');
        break;

      case 'auth/operation-not-supported-in-this-environment':
        userFriendlyMessage = 'Google Sign-In is not supported in this environment. Try email/password instead.';
        authLogger.error('[GoogleAuthManager] Pop-up sign-in not supported');
        break;

      case 'auth/unauthorized-domain':
        userFriendlyMessage = 'This domain is not authorized for Google Sign-In. Contact support.';
        authLogger.error('[GoogleAuthManager] Domain not authorized in Firebase Console');
        break;

      case 'auth/invalid-api-key':
        userFriendlyMessage = 'Configuration error. Please contact support.';
        authLogger.error('[GoogleAuthManager] Invalid Firebase API key');
        break;

      case 'auth/account-exists-with-different-credential':
        userFriendlyMessage = 'An account already exists with this email. Try signing in with email/password instead.';
        authLogger.warn('[GoogleAuthManager] Account exists with different provider');
        break;

      case 'auth/credential-already-in-use':
        userFriendlyMessage = 'This Google account is already linked to another SureDev account.';
        authLogger.warn('[GoogleAuthManager] Credential in use');
        break;

      default:
        authLogger.error('[GoogleAuthManager] Unexpected error', { code: errorCode, message: errorMessage });
    }

    throw new Error(userFriendlyMessage);
  }

  // Verify Google OAuth credentials are properly configured
  static verifyConfiguration(): void {
    try {
      const configStr = localStorage.getItem('_firebase_config_check');
      authLogger.info('[GoogleAuthManager] Verifying Firebase configuration...');
      
      // Check if essential OAuth settings are loaded
      if (!window.__FIREBASE_DEFAULTS__) {
        authLogger.warn('[GoogleAuthManager] Firebase defaults not found in window');
      }
    } catch (e) {
      authLogger.warn('[GoogleAuthManager] Could not verify configuration', e);
    }
  }
}

export const googleAuthManager = new GoogleAuthManager();
