// For development: Use Firebase REST API instead of Admin SDK
// This avoids the need for service account credentials during development

// Firebase configuration interface
interface UserConnectionData {
  fid: number;
  username?: string;
  displayName?: string;
  walletAddress?: string;
  connectionType?: 'wallet_connect' | 'farcaster_auth' | 'demo';
  timestamp?: string;
  userAgent?: string;
  ip?: string;
  origin?: string;
  referer?: string;
}

interface UserData extends UserConnectionData {
  pfpUrl?: string;
  custodyAddress?: string;
  connectedAddress?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
  lastActiveAt?: string;
  updatedAt?: string;
}

const FIREBASE_PROJECT_ID = 'snap-coffee';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Simple Firebase REST API client for development
 * Note: In production, use Firebase Admin SDK with proper service account credentials
 */

/**
 * Save user to Firebase Firestore users collection using REST API
 */
export async function saveUserToFirebase(userData: UserData): Promise<boolean> {
  try {
    console.log('💾 Saving user to Firebase:', userData.fid, userData.username);
    
    const now = new Date().toISOString();
    const userDoc = {
      fields: {
        fid: { integerValue: userData.fid.toString() },
        username: { stringValue: userData.username || '' },
        displayName: { stringValue: userData.displayName || '' },
        walletAddress: { stringValue: userData.walletAddress || '' },
        connectionType: { stringValue: userData.connectionType || '' },
        userAgent: { stringValue: userData.userAgent || '' },
        ip: { stringValue: userData.ip || '' },
        origin: { stringValue: userData.origin || '' },
        referer: { stringValue: userData.referer || '' },
        createdAt: { timestampValue: now },
        lastActiveAt: { timestampValue: now },
        updatedAt: { timestampValue: now }
      }
    };
    
    // Use Firebase REST API with upsert (merge: true equivalent)
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/users/${userData.fid}?updateMask.fieldPaths=*`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDoc)
      }
    );
    
    if (!response.ok) {
      console.warn('⚠️ Firebase REST API error:', response.status, response.statusText);
      return false;
    }
    
    console.log('✅ User saved to Firebase successfully:', userData.fid);
    return true;
  } catch (error) {
    console.error('❌ Error saving user to Firebase:', error);
    return false;
  }
}

/**
 * Log user connection event to Firebase using REST API
 */
export async function logUserConnectionToFirebase(userData: UserConnectionData): Promise<boolean> {
  try {
    console.log('📊 Logging user connection to Firebase:', userData.fid, userData.connectionType);
    
    // Save/update user in users collection
    const userSaved = await saveUserToFirebase(userData);
    
    // Also log the connection event in a separate collection
    const connectionId = `${userData.fid}_${Date.now()}`;
    const now = new Date().toISOString();
    
    const connectionDoc = {
      fields: {
        fid: { integerValue: userData.fid.toString() },
        username: { stringValue: userData.username || '' },
        displayName: { stringValue: userData.displayName || '' },
        walletAddress: { stringValue: userData.walletAddress || '' },
        connectionType: { stringValue: userData.connectionType || '' },
        userAgent: { stringValue: userData.userAgent || '' },
        ip: { stringValue: userData.ip || '' },
        origin: { stringValue: userData.origin || '' },
        referer: { stringValue: userData.referer || '' },
        timestamp: { timestampValue: now }
      }
    };
    
    const connectionResponse = await fetch(
      `${FIRESTORE_BASE_URL}/user_connections?documentId=${connectionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionDoc)
      }
    );
    
    if (!connectionResponse.ok) {
      console.warn('⚠️ Firebase connection log error:', connectionResponse.status);
    }
    
    console.log('✅ User connection logged to Firebase successfully');
    return userSaved;
  } catch (error) {
    console.error('❌ Error logging user connection to Firebase:', error);
    return false;
  }
}

/**
 * Get user from Firebase using REST API
 */
export async function getUserFromFirebase(fid: number): Promise<UserData | null> {
  try {
    const response = await fetch(`${FIRESTORE_BASE_URL}/users/${fid}`);
    
    if (response.ok) {
      const data = await response.json();
      // Convert Firebase REST format back to regular object
      const userData: UserData = {
        fid: parseInt(data.fields.fid.integerValue),
        username: data.fields.username?.stringValue,
        displayName: data.fields.displayName?.stringValue,
        walletAddress: data.fields.walletAddress?.stringValue,
        connectionType: data.fields.connectionType?.stringValue as any,
        userAgent: data.fields.userAgent?.stringValue,
        ip: data.fields.ip?.stringValue,
        origin: data.fields.origin?.stringValue,
        referer: data.fields.referer?.stringValue,
        createdAt: data.fields.createdAt?.timestampValue,
        lastActiveAt: data.fields.lastActiveAt?.timestampValue,
        updatedAt: data.fields.updatedAt?.timestampValue
      };
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user from Firebase:', error);
    return null;
  }
}