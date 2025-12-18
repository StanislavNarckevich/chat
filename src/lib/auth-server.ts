// src/lib/auth-server.ts
import { admin } from "@/lib/firebase-admin";
import { UserRole } from "./roles";


export async function createCustomToken(phone: string, role: UserRole = "client") {
    const uid = `phone_${phone.replace(/\D/g, '')}`;
    const customClaims = { role };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    const token = await admin.auth().createCustomToken(uid);
    return token;
}


export async function setUserRole(uid: string, role: UserRole) {
    if (!['admin', 'manager'].includes(role)) {
        throw new Error('Invalid role for email users');
    }
    await admin.auth().setCustomUserClaims(uid, { role });
}


export async function getUser(uid: string) {
    return admin.auth().getUser(uid);
}