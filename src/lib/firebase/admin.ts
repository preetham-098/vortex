import * as admin from 'firebase-admin';
import { isFirebaseAdminConfigured } from './config';

let adminApp: admin.app.App | undefined;
let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

export function getFirebaseAdmin() {
  if (!isFirebaseAdminConfigured()) {
    return { adminApp: null, adminDb: null, adminAuth: null };
  }

  if (!admin.apps.length) {
    try {
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      adminDb = admin.firestore(adminApp);
      adminAuth = admin.auth(adminApp);
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      return { adminApp: null, adminDb: null, adminAuth: null };
    }
  } else {
    adminApp = admin.app();
    adminDb = admin.firestore(adminApp);
    adminAuth = admin.auth(adminApp);
  }

  return { adminApp, adminDb, adminAuth };
}
