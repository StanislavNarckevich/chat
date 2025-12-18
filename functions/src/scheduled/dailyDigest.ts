// functions/src/scheduled/dailyDigest.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// Конфиг SendPulse — лучше хранить в secrets
const SENDPULSE_ID = process.env.SENDPULSE_ID!;
const SENDPULSE_SECRET = process.env.SENDPULSE_SECRET!;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getSendPulseToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const res = await fetch("https://api.sendpulse.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: SENDPULSE_ID,
            client_secret: SENDPULSE_SECRET,
        }),
    });

    const data = await res.json();
    if (!data.access_token) {
        throw new Error("Failed to get SendPulse token: " + JSON.stringify(data));
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000;

    return cachedToken as string;
}

export async function runDailyDigest() {
    logger.info("Запуск рассылки непрочитанных сообщений");

    const usersSnap = await db.collection("users_public").get();

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const publicData = userDoc.data();
        const notification = publicData.notification as "email" | "sms" | "whatsapp" | "none" | undefined;

        if (!notification || notification === "none") continue;

        const privateSnap = await db.collection("users_private").doc(uid).get();
        if (!privateSnap.exists) continue;
        const privateData = privateSnap.data()!;

        const email = privateData.email;
        const phone = privateData.phone;

        if (notification === "email" && !email) continue;
        if ((notification === "sms" || notification === "whatsapp") && !phone) continue;

        const roomsSnap = await db
            .collection("rooms")
            .where("participants", "array-contains", uid)
            .where("status", "==", "active")
            .get();

        let totalUnread = 0;
        const roomNames: string[] = [];

        for (const room of roomsSnap.docs) {
            const unread = room.data().unreadCount?.[uid] || 0;
            if (unread > 0) {
                totalUnread += unread;
                roomNames.push(room.data().title || "Без названия");
            }
        }

        if (totalUnread === 0) continue;

        try {
            const token = await getSendPulseToken();

            if (notification === "email" && email) {
                await fetch("https://api.sendpulse.com/smtp/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: {
                            subject: `У вас ${totalUnread} новых сообщений в Topli Chat`,
                            from: { name: "Topli Chat", email: "no-reply@topli.chat" },
                            to: [{ email }],
                            html: `
                  <h2>У вас ${totalUnread} непрочитанных сообщений</h2>
                  <p>Чаты: ${roomNames.slice(0, 10).join(", ")}${roomNames.length > 10 ? " и другие" : ""}</p>
                  <p><a href="https://topli.chat/rooms">Открыть чат</a></p>
                `,
                        },
                    }),
                });
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
                        body: `Topli Chat\nУ вас ${totalUnread} новых сообщений!\n\nЧаты: ${roomNames.slice(0, 5).join(", ")}\n\nhttps://topli.chat/rooms`,
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
                        body: `Topli Chat: ${totalUnread} новых сообщений. Откройте: https://topli.chat/rooms`,
                    }),
                });
            }

            logger.info("Уведомление отправлено", { uid, channel: notification, totalUnread });
        } catch (err) {
            logger.error("Ошибка отправки уведомления", { uid, channel: notification, err });
        }
    }

    logger.info("Рассылка завершена");
}

// === Планировщик — вызывает нашу функцию ===
export const dailyDigest = onSchedule(
    {
        schedule: "0 9 * * *",
        timeZone: "Europe/Kiev",
        region: "europe-west1",
        memory: "512MiB",
        timeoutSeconds: 540,
    },
    async () => {
        await runDailyDigest();
    }
);

// === ТЕСТОВАЯ HTTPS ФУНКЦИЯ — для ручного запуска ===
export const testDigest = onCall(
    { cors: true, region: "europe-west1" },
    async (request) => {
        if (!request.auth?.uid) {
            throw new Error("Unauthorized");
        }

        logger.info("Ручной запуск рассылки от", request.auth.uid);
        await runDailyDigest();

        return { success: true, message: "Рассылка запущена!" };
    }
);