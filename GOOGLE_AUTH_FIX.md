# Google Authentication Fix - Implementation Guide

## Overview

This document outlines the Google OAuth 2.0 authentication fixes implemented for the SURE-DEV application. The fixes address security vulnerabilities and implement proper OAuth 2.0 flow with Firebase integration.

## Changes Made

### 1. **public/google-auth.html** - Updated OAuth Popup
- ✅ Replaced mock authentication with proper Google Sign-In Library
- ✅ Integrated `accounts.google.com/gsi/client` for official OAuth 2.0
- ✅ Secure JWT token handling and validation
- ✅ Proper origin validation for postMessage communication
- ✅ Error handling and user feedback

**Key Features:**
```html
<!-- Official Google Sign-In Button -->
<div id="g_id_signin" 
     data-type="standard" 
     data-size="large" 
     data-theme="outline">
</div>
```

### 2. **src/lib/googleAuth.ts** - New Utility Functions
Comprehensive OAuth 2.0 utility module with:

- `openGoogleAuthWindow()` - Secure popup window handler
- `decodeJWT()` - Safe JWT token decoding
- `generateNonce()` - CSRF protection nonce
- `validateIdToken()` - Client-side token validation
- `extractUserFromToken()` - User data extraction

**Example Usage:**
```typescript
import { openGoogleAuthWindow, validateIdToken } from '@/lib/googleAuth';

const handleGoogleSignIn = () => {
  openGoogleAuthWindow(
    clientId,
    (user) => {
      // Handle successful auth
      console.log('User:', user);
    },
    (error) => {
      // Handle auth error
      console.error('Auth error:', error);
    }
  );
};
```

### 3. **Environment Configuration**

Create a `.env` file with Google OAuth credentials:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth 2.0 Configuration
VITE_GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Server Configuration
GCLOUD_PROJECT=your_project_id
```

## Security Improvements

### ✅ Before (Vulnerable)
```javascript
// Mock data without real OAuth
function selectAccount(name, email, avatar) {
  window.opener.postMessage({
    type: 'GOOGLE_AUTH_SUCCESS',
    user: { name, email, avatar }
  }, '*'); // Unsafe - accepts any origin
}
```

### ✅ After (Secure)
```typescript
// Proper OAuth 2.0 with JWT validation
function handleCredentialResponse(response) {
  const token = response.credential;
  
  // Validate token
  if (!validateIdToken(token, clientId)) {
    throw new Error('Invalid token');
  }
  
  // Extract user info
  const user = extractUserFromToken(token);
  
  // Secure origin check
  window.opener.postMessage(
    { type: 'GOOGLE_AUTH_SUCCESS', user, idToken: token },
    window.location.origin // Only trust same origin
  );
}
```

## Implementation Checklist

- [x] Replace mock OAuth with Google Sign-In Library
- [x] Add JWT token validation
- [x] Implement secure origin verification
- [x] Create utility functions for reusability
- [x] Add CSRF protection with nonce
- [x] Error handling and user feedback
- [ ] Server-side token verification (implement in backend)
- [ ] Configure OAuth consent screen in Google Cloud Console
- [ ] Add refresh token handling
- [ ] Implement logout functionality

## Integration Steps

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 credential (Web Application)
3. Add authorized redirect URIs:
   - `http://localhost:5173` (development)
   - `https://your-domain.com` (production)
4. Copy the Client ID

### Step 2: Update Environment Variables
```bash
VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### Step 3: Update Modals.tsx
Replace the fallback popup handler with the new utility:

```typescript
import { openGoogleAuthWindow } from '@/lib/googleAuth';

const handleGoogleSignIn = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  
  if (!clientId) {
    setError('Google OAuth is not configured');
    return;
  }

  openGoogleAuthWindow(
    clientId,
    async (user) => {
      // Process authenticated user
      try {
        const result = await signInWithPopup(auth, provider);
        // ... rest of login logic
      } catch (error) {
        console.error('Login error:', error);
      }
    },
    (error) => {
      setError(error);
    }
  );
};
```

### Step 4: Server-Side Token Verification
In your backend (server.ts or firebaseAdmin.ts):

```typescript
import { auth } from 'firebase-admin';

async function verifyGoogleToken(idToken: string) {
  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}
```

## Key Security Features

| Feature | Benefit |
|---------|---------|
| JWT Token Validation | Prevents token tampering |
| Origin Verification | Protects against XSS attacks |
| Nonce Generation | CSRF protection |
| Server-side Verification | Ensures token legitimacy |
| Token Expiration Check | Prevents replay attacks |
| Audience Validation | Ensures token is for your app |

## Testing

### Manual Testing
1. Open login modal
2. Click "Google Account Auth" button
3. Popup window opens with real Google Sign-In
4. Select Google account
5. Successfully authenticated and redirected

### Unit Tests (To Implement)
```typescript
describe('Google Auth', () => {
  it('should validate a valid token', () => {
    const token = generateTestToken();
    expect(validateIdToken(token, clientId)).toBe(true);
  });

  it('should reject expired tokens', () => {
    const token = generateExpiredToken();
    expect(validateIdToken(token, clientId)).toBe(false);
  });

  it('should verify origin in postMessage', () => {
    // Test origin validation
  });
});
```

## Troubleshooting

### Issue: "Google OAuth Client ID is not configured"
**Solution:** Ensure `VITE_GOOGLE_OAUTH_CLIENT_ID` is set in `.env`

### Issue: "Cross-Origin Request Blocked"
**Solution:** Add your domain to OAuth 2.0 authorized redirect URIs in Google Cloud Console

### Issue: "Token is expired"
**Solution:** Implement token refresh logic using `refreshToken`

### Issue: Popup blocked
**Solution:** Call OAuth function directly from user interaction (click), not async operation

## Next Steps

1. **Implement Server-Side Verification** - Always verify tokens on the backend
2. **Add Token Refresh** - Implement refresh token rotation
3. **Session Management** - Track session expiration
4. **Logout Handler** - Properly clear Firebase auth session
5. **Multi-Factor Authentication** - Add 2FA support
6. **Audit Logging** - Log all authentication events

## References

- [Google Identity Documentation](https://developers.google.com/identity/gsi/web)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Google Cloud Console OAuth settings
3. Verify environment variables are correctly set
4. Check browser console for detailed error messages
