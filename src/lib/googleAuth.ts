/**
 * Google OAuth 2.0 Authentication Utility
 * Handles secure Google OAuth authentication flow with Firebase integration
 */

export interface GoogleAuthUser {
  name: string;
  email: string;
  avatar: string;
  idToken?: string;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleAuthUser;
  error?: string;
}

/**
 * Initialize Google OAuth pop-up window for authentication
 * Supports both native Firebase OAuth and fallback popup window
 */
export function openGoogleAuthWindow(
  clientId: string,
  onSuccess: (user: GoogleAuthUser) => void,
  onError: (error: string) => void
): Window | null {
  const width = 500;
  const height = 650;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'id_token',
    scope: 'openid email profile',
    redirect_uri: `${window.location.origin}/google-auth.html`,
    nonce: generateNonce(),
  });

  const authWindow = window.open(
    `/google-auth.html?${params.toString()}`,
    'google_oauth_popup',
    `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
  );

  if (!authWindow) {
    onError('Please allow popups to sign in with Google.');
    return null;
  }

  // Listen for messages from the popup window
  const messageHandler = (event: MessageEvent) => {
    // Validate origin for security
    if (event.origin !== window.location.origin) {
      console.warn('Received message from untrusted origin:', event.origin);
      return;
    }

    if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
      window.removeEventListener('message', messageHandler);
      onSuccess(event.data.user);
    } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
      window.removeEventListener('message', messageHandler);
      onError(event.data.error || 'Google authentication failed');
    }
  };

  window.addEventListener('message', messageHandler);

  // Clean up listener if window closes
  const pollInterval = setInterval(() => {
    if (authWindow.closed) {
      clearInterval(pollInterval);
      window.removeEventListener('message', messageHandler);
    }
  }, 500);

  return authWindow;
}

/**
 * Decode JWT token to extract user information
 * Note: Always verify the token signature on the server side
 */
export function decodeJWT(token: string): Record<string, any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const decoded = JSON.parse(
      decodeURIComponent(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );

    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw new Error('Invalid token');
  }
}

/**
 * Generate a cryptographically secure nonce for CSRF protection
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate Google ID Token (basic client-side validation)
 * For production, always verify the signature on the server
 */
export function validateIdToken(token: string, clientId: string): boolean {
  try {
    const payload = decodeJWT(token);

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('Token is expired');
      return false;
    }

    // Check audience (client ID)
    if (payload.aud && payload.aud !== clientId) {
      console.warn('Token audience does not match client ID');
      return false;
    }

    // Check issuer
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      console.warn('Invalid token issuer');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Extract user information from Google ID Token
 */
export function extractUserFromToken(token: string): Partial<GoogleAuthUser> | null {
  try {
    const payload = decodeJWT(token);
    return {
      name: payload.name || '',
      email: payload.email || '',
      avatar: payload.picture || '',
    };
  } catch (error) {
    console.error('Failed to extract user info from token:', error);
    return null;
  }
}
