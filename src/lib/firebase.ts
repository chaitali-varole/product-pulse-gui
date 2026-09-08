import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";


import { firebaseConfig } from "./firebase-config";

const config = firebaseConfig;

/** True when the Firebase web config is present in the environment. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let authInstance: Auth | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        });
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
