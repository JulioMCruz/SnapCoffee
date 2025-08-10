import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export interface UserData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custodyAddress: string;
  connectedAddress?: string;
  walletAddress?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  connectionType?: 'wallet_connect' | 'farcaster_auth' | 'demo';
  createdAt?: any;
  lastActiveAt?: any;
}

/**
 * Save user to Firebase Firestore
 */
export async function saveUserToFirebase(userData: UserData): Promise<boolean> {
  try {
    console.log('💾 Saving user to Firebase:', userData.fid, userData.username);
    
    const userRef = doc(db, 'users', userData.fid.toString());
    
    const userDoc = {
      ...userData,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userRef, userDoc, { merge: true });
    
    console.log('✅ User saved to Firebase successfully:', userData.fid);
    return true;
  } catch (error) {
    console.error('❌ Error saving user to Firebase:', error);
    return false;
  }
}

/**
 * Log user connection event to Firebase
 */
export async function logUserConnectionToFirebase(userData: UserData): Promise<boolean> {
  try {
    console.log('📊 Logging user connection to Firebase:', userData.fid, userData.connectionType);
    
    // Save/update user in users collection
    const userSaved = await saveUserToFirebase(userData);
    
    // Also log the connection event
    const connectionRef = doc(collection(db, 'user_connections'));
    const connectionDoc = {
      fid: userData.fid,
      username: userData.username,
      displayName: userData.displayName,
      walletAddress: userData.walletAddress || userData.connectedAddress,
      connectionType: userData.connectionType,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    await setDoc(connectionRef, connectionDoc);
    
    console.log('✅ User connection logged to Firebase successfully');
    return userSaved;
  } catch (error) {
    console.error('❌ Error logging user connection to Firebase:', error);
    return false;
  }
}