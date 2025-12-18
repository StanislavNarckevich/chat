"use client";

import { onAuthStateChanged, onIdTokenChanged, User } from "firebase/auth";
import {auth, db} from "@/lib/firebase";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {doc, getDoc} from "firebase/firestore";

interface AuthContextValue {
    user: User | null;
    role: string | null;
    // userName: string | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    role: null,
    loading: true,
    // userName: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (u) {
                const snap = await getDoc(doc(db, "users_private", u.uid));
                setRole(snap.data()?.role || null);
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);