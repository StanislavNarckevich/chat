import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

export function useUserProfile(user: User | null, open: boolean) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || !open) return;

        const load = async () => {
            setLoading(true);

            const ref = doc(db, "users_public", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                setProfile(snap.data());
            }

            setLoading(false);
        };

        load();
    }, [user, open]);

    return { profile, loading };
}
