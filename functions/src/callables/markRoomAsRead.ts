// functions/src/callables/markRoomAsRead.ts
import { onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { logger } from "firebase-functions";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const markRoomAsRead = onCall(
    { region: "europe-west1" },
    async (request) => {
        const uid = request.auth?.uid;
        const roomId = request.data?.roomId;

        if (!uid || !roomId) {
            throw new Error("Invalid request");
        }

        const userRef = db.collection("users_private").doc(uid);

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists) return;

            const data = snap.data()!;
            const unreadRooms = data.unreadRooms || {};
            const roomUnread = unreadRooms[roomId];

            if (!roomUnread) {
                // уже прочитано
                return;
            }

            const newUnreadTotal = Math.max(
                (data.unreadTotal || 0) - roomUnread,
                0
            );

            delete unreadRooms[roomId];

            tx.update(userRef, {
                unreadTotal: newUnreadTotal,
                unreadRooms,
            });
        });

        logger.info("Room marked as read", { uid, roomId });
        return { success: true };
    }
);
