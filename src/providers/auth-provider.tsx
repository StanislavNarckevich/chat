"use client";

import { onAuthStateChanged, onIdTokenChanged, User } from "firebase/auth";
import {auth, db} from "@/lib/firebase";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {doc, getDoc, onSnapshot} from "firebase/firestore";

interface AuthContextValue {
    user: User | null;
    role: string | null;
    // userName: string | null;
    unreadRooms: Record<string, number>;
    unreadTotal: number;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    role: null,
    loading: true,
    unreadRooms: {},
    unreadTotal: 0,
    // userName: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [unreadRooms, setUnreadRooms] = useState<Record<string, number>>({});
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                setRole(null);
                setUnreadRooms({});
                setUnreadTotal(0);
                setLoading(false);
                return;
            }

            const userRef = doc(db, "users_private", u.uid);

            const unsubPrivate = onSnapshot(userRef, (snap) => {
                const data = snap.data() || {};
                setRole(data.role || null);
                setUnreadRooms(data.unreadRooms || {});
                setUnreadTotal(data.unreadTotal || 0);
                setLoading(false);
            });

            return () => unsubPrivate();
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                unreadRooms,
                unreadTotal,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);