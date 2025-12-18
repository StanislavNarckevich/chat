"use client";

import { useEffect, useState } from "react";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {useAuthContext} from "@/providers/auth-provider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {useGlobalLoader} from "@/providers/global-loader-provider";
import {OnlyPhoneLogin} from "@/components/auth/only-phone-login";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState(searchParams.get("mode") || "email");
    const { user, loading } = useAuthContext();
    const { setGlobalLoading } = useGlobalLoader();

    // save inviteId if exist
    useEffect(() => {
        const inviteId = searchParams.get("inviteId");
        if (inviteId) {
            localStorage.setItem("inviteId", inviteId);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!loading && user) {
            signOut(auth);
        }
    }, [loading]);


    return (
        <div className="flex items-center justify-center w-full bg-gray-50 dark:bg-black">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {mode === "email" ? (
                        <motion.div
                            key="email"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <OnlyPhoneLogin setMode={setMode} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="phone"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PhoneLoginForm setMode={setMode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
