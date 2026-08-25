'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Browser-side Firebase, used only for signing in.
 * These values are public by design — Firebase config is not a secret. What
 * protects the memorial is the allowlist checked on the server in
 * /api/auth/session, plus sign-up being disabled in the Firebase console.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function clientAuth() {
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}

export function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export function firebaseAuthReady(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

/** Turns Firebase's error codes into something a person can act on. */
export function readableAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match an account.';
    case 'auth/invalid-email':
      return 'That does not look like a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'That sign-in method is switched off in the Firebase console.';
    case 'auth/admin-restricted-operation':
      return 'New accounts cannot be created here. Ask for an account to be added for you.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Sign-in failed. Please try again.';
  }
}
