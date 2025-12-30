import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import admin from "firebase-admin";
import pLimit from "p-limit";
import {defineSecret} from "firebase-functions/params";

const SENDPULSE_ID = defineSecret("SENDPULSE_ID");
const SENDPULSE_SECRET = defineSecret("SENDPULSE_SECRET");

if (!admin.apps.length) {
    admin.initializeApp(); // 🔥 ВАЖНО: без serviceAccount
}

const db = admin.firestore();
const limit = pLimit(10);

// ===== USER PROCESSING =====
async function processUserTest(userDoc: FirebaseFirestore.QueryDocumentSnapshot) {
    const uid = userDoc.id;

    const privateSnap = await db.collection("users_private").doc(uid).get();
    if (!privateSnap.exists) return;

    const privateData = privateSnap.data()!;
    const { unreadTotal, unreadRooms } = privateData;

    if (!unreadTotal || unreadTotal === 0) return;

    const rooms = Object.keys(unreadRooms || {});

    await db.collection("system_digest_test").add({
        uid,
        unreadTotal,
        rooms,
        ts: admin.firestore.FieldValue.serverTimestamp(),
       sp_id: SENDPULSE_ID.value(),
        sp_secr: SENDPULSE_SECRET.value()
    });

    logger.info("Test digest saved", { uid, unreadTotal });
}

// ===== MAIN =====
async function runDailyDigestTest() {
    logger.info("Daily TEST digest started");

    const usersSnap = await db.collection("users_public").get();

    await Promise.all(
        usersSnap.docs.map((doc) =>
            limit(() => processUserTest(doc))
        )
    );

    logger.info("Daily TEST digest finished");
}

// ===== SCHEDULE =====
export const dailyDigestTest = onSchedule(
    {
        schedule: "*/5 * * * *", // ⏱ каждые 5 минут для теста
        timeZone: "Europe/Kiev",
        region: "europe-west1",
        memory: "256MiB",
        timeoutSeconds: 300,
        secrets: [SENDPULSE_ID, SENDPULSE_SECRET],
    },
    async () => {
        await runDailyDigestTest();
    }
);
