import { getUserRole } from "@/lib/auth-utils";
import { User } from "firebase/auth";

export async function saveUserToFirestore(user: User | null) {
    if (!user?.uid) return;

    try {
        let role = await getUserRole(user);

        if (!role) {
            role = "client";
        }

        const maskedPhone = role !== "admin" ? maskPhone(user.phoneNumber || "") : user.phoneNumber;

        await fetch("/api/auth/save-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email || null,
                phone: user.phoneNumber || null,
                name: user.displayName || null,
                photoURL: user.photoURL || null,
                role,
                maskedPhone,
                position: null,
                company: null,
                language: "TR",
                notification: "email",
            }),
        });
    } catch (error: any) {
        console.error("saveUserToFirestore error:", error);
    }
}

export function maskPhone(phone: string | null) {
    if (!phone) return null;
    return phone.replace(/(\+\d{2})\d{6}(\d{2})/, "$1••••••$2");
}