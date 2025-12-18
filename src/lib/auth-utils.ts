import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


export async function getUserRole(user: User): Promise<string | null> {
    if (!user) return null;
    const userDoc = await getDoc(doc(db, "users_private", user.uid));
    return userDoc.data()?.role || null;
}