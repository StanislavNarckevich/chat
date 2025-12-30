// functions/src/scheduled/dailyDigest.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import admin from "firebase-admin";
import pLimit from "p-limit";
import { defineSecret } from "firebase-functions/params";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const limit = pLimit(10);

// ===== SendPulse ENV =====
const SENDPULSE_ID = defineSecret("SENDPULSE_ID");
const SENDPULSE_SECRET = defineSecret("SENDPULSE_SECRET");

// ===== OAuth cache =====
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getSendPulseToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }
    const clientId = SENDPULSE_ID.value();
    const clientSecret = SENDPULSE_SECRET.value();

    const res = await fetch("https://api.sendpulse.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`SendPulse token HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (!data.access_token) {
        throw new Error("SendPulse token error: " + JSON.stringify(data));
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000;

    return cachedToken as string;
}

// ===== USER PROCESSING =====
async function processUser(userDoc: FirebaseFirestore.QueryDocumentSnapshot) {
    const uid = userDoc.id;
    const publicData = userDoc.data();

    const notification = publicData.notification as
        | "email"
        | "sms"
        | "whatsapp"
        | "none"
        | undefined;

    if (!notification || notification === "none") return;

    const privateSnap = await db.collection("users_private").doc(uid).get();
    if (!privateSnap.exists) return;

    const privateData = privateSnap.data()!;
    const { email, phone, unreadTotal, unreadRooms } = privateData;

    if (!unreadTotal || unreadTotal === 0) return;

    if (notification === "email" && !email) return;
    if ((notification === "sms" || notification === "whatsapp") && !phone) return;

    const roomIds = Object.keys(unreadRooms || {});
    const roomNames = roomIds.slice(0, 10); // можно заменить на реальные названия при желании

    const token = await getSendPulseToken();

    if (notification === "email" && email) {
        const res = await fetch("https://api.sendpulse.com/smtp/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: {
                    subject: `У вас ${unreadTotal} новых сообщений в Topli Chat`,
                    from: { name: "Topli Chat", email: "stanislav.narkevich@letsdev.software" },
                    to: [{ email }],
                    html: `
                        <h2>У вас ${unreadTotal} непрочитанных сообщений</h2>
                        <p>Чаты: ${roomNames.join(", ")}${roomIds.length > 10 ? " и другие" : ""}</p>
                        <p><a href="https://topli.chat/rooms">Открыть чат</a></p>
                    `,
                },
            }),
        });

        console.log(res)
    }

    if (notification === "whatsapp" && phone) {
        await fetch("https://api.sendpulse.com/whatsapp/messages", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: phone,
                body: `Topli Chat\nУ вас ${unreadTotal} новых сообщений!\n\nhttps://topli.chat/rooms`,
            }),
        });
    }

    if (notification === "sms" && phone) {
        await fetch("https://api.sendpulse.com/sms/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phones: [phone],
                body: `Topli Chat: ${unreadTotal} новых сообщений. https://topli.chat/rooms`,
            }),
        });
    }

    logger.info("Digest sent", { uid, unreadTotal, channel: notification });
}

// ===== MAIN =====
export async function runDailyDigest() {
    logger.info("Daily digest started");

    // 🔐 lock от двойного запуска
    const lockRef = db.doc("system/dailyDigestLock");
    const skipLock = false; // for tests
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(lockRef);
        if (!skipLock && snap.exists) {
            const lastRun = snap.data()!.ts;
            if (Date.now() - lastRun < 23 * 60 * 60 * 1000) {
                throw new Error("Digest already executed today");
            }
        }
        tx.set(lockRef, { ts: Date.now() });
    });

    const usersSnap = await db.collection("users_public").get();

    await Promise.all(
        usersSnap.docs.map((doc) =>
            limit(() => processUser(doc))
        )
    );

    logger.info("Daily digest finished");
}

// ===== SCHEDULE =====
export const dailyDigest = onSchedule(
    {
        schedule: "0 9 * * *",
        timeZone: "Europe/Kiev",
        region: "europe-west1",
        memory: "512MiB",
        timeoutSeconds: 540,
        secrets: [SENDPULSE_ID, SENDPULSE_SECRET],
    },
    async () => {
        await runDailyDigest();
    }
);

// ===== MANUAL TEST =====
export const testDigest = onCall(
    { cors: true, region: "europe-west1" },
    async (request) => {
        if (!request.auth?.uid) {
            throw new Error("Unauthorized");
        }

        await runDailyDigest();
        return { success: true };
    }
);
