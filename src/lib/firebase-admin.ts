import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";

const dbName = process.env.FIREBASE_DB_NAME

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

const adminAuth= admin.auth();
// const adminDb = admin.firestore();
const adminDb = getFirestore(dbName!);

export { admin, adminDb, adminAuth };
