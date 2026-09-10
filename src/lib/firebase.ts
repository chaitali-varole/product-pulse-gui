import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

import { firebaseConfig } from "./firebase-config";

const config = firebaseConfig;

/** True when the Firebase web config is present. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let authInstance: Auth | null = null;
let analyticsStarted = false;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config);
  }
  return app;
}

/** Firestore instance, or null when the project isn't configured yet. */
export function getDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!firestore) firestore = getFirestore(a);
  return firestore;
}

/** Firebase Auth instance, or null when the project isn't configured yet. */
export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!authInstance) authInstance = getAuth(a);
  return authInstance;
}

/**
 * Starts Google Analytics for Firebase. Browser-only and safe to call more
 * than once; does nothing during server rendering.
 */
export function startAnalytics(): void {
  if (analyticsStarted || typeof window === "undefined") return;
  const a = getFirebaseApp();
  if (!a || !config.measurementId) return;
  analyticsStarted = true;
  void (async () => {
    try {
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (await isSupported()) getAnalytics(a);
    } catch {
      analyticsStarted = false;
    }
  })();
}
