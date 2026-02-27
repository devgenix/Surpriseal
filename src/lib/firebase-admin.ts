import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("Initializing Firebase Admin... Project:", projectId);

  if (projectId && clientEmail && privateKey) {
    try {
      // Handle potential double quotes and literal \n or escaped \n
      if (typeof privateKey === 'string') {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        // Handle both \\n and \n literal characters
        privateKey = privateKey.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
    }
  } else {
    console.warn("Firebase admin credentials missing:", { 
      projectId: !!projectId, 
      clientEmail: !!clientEmail, 
      privateKey: !!privateKey 
    });
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
if (adminDb) {
  // Set settings to avoid hangs in some environments
  try {
    adminDb.settings({ ignoreUndefinedProperties: true });
  } catch (e) {}
}

export { adminDb };
