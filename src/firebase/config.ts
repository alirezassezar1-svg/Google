/**
 * Firebase Client SDK Configuration & Authentication Services
 * Integrates Firebase Auth and Firestore with graceful offline & local fallback.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { Project } from '../types';

// Default configuration with environment variables or fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKeyForLocalDev12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nononick-editor.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nononick-editor',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nononick-editor.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcd1234ef5678',
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'AIzaSyDemoPlaceholderKeyForLocalDev12345'
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialized in offline/fallback mode:', error);
}

export { auth, db };

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

/**
 * Sign in using Google Provider
 */
export async function loginWithGoogle(): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    isAnonymous: result.user.isAnonymous,
  };
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    isAnonymous: result.user.isAnonymous,
  };
}

/**
 * Register a new user with Email and Password
 */
export async function registerWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    isAnonymous: result.user.isAnonymous,
  };
}

/**
 * Continue as Guest / Anonymous user
 */
export async function loginAsGuest(): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInAnonymously(auth);
  return {
    uid: result.user.uid,
    email: null,
    displayName: 'Guest Architect',
    photoURL: null,
    isAnonymous: true,
  };
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.isAnonymous ? 'Guest User' : 'Developer'),
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Save project to Cloud Firestore
 */
export async function saveProjectToFirestore(project: Project, userId: string): Promise<void> {
  if (!db) return;
  const projectRef = doc(db, 'projects', project.id);
  await setDoc(
    projectRef,
    {
      ...project,
      ownerId: userId,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/**
 * Retrieve user projects from Cloud Firestore
 */
export async function loadProjectsFromFirestore(userId: string): Promise<Project[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as Project);
  } catch (err) {
    console.error('Error fetching projects from Firestore:', err);
    return [];
  }
}

/**
 * Delete project from Cloud Firestore
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  if (!db) return;
  const projectRef = doc(db, 'projects', projectId);
  await deleteDoc(projectRef);
}
