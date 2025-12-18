"use client";

import { useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveUserToFirestore } from "@/lib/save-user-to-firestore";
import {redirect, useSearchParams} from "next/navigation";
import {applyInvite} from "@/lib/applyInvite";

const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);


export default function RegisterPage() {
    redirect("/login");

    const t = useTranslations("register");
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);

    const inviteId = searchParams.get("inviteId") || (typeof window !== "undefined" ? localStorage.getItem("inviteId") : null);

    // save inviteId to localStorage
    useEffect(() => {
        const inviteId = searchParams.get("inviteId");
        if (inviteId) {
            localStorage.setItem("inviteId", inviteId);
        }
    }, [searchParams]);


    const handleRegister = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!displayName || !email || !password || !confirm) {
            toast.error(t("fillAllFields"));
            return;
        }

        if (!isValidEmail(email)) {
            toast.error(t("invalidEmail"));
            return;
        }

        if (password.length < 6) {
            toast.error(t("shortPassword"));
            return;
        }

        if (password !== confirm) {
            toast.error(t("passwordMismatch"));
            return;
        }

        try {
            setLoading(true);

            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(user, { displayName });
            const role = inviteId ? 'client' : 'manager'
            // await saveUserToFirestore(user, role);
            await saveUserToFirestore(user);


            if (inviteId) {
                const roomId = await applyInvite(user, inviteId);

                if (roomId) {
                    router.push(`/rooms/${roomId}`);
                    toast.success(`Welcome, ${user.displayName || "user"}!`);
                }
            } else {
                // If no invite — normal flow
                toast.success(t("registered"));
                router.push("/rooms");
            }

        } catch (error: any) {
            toast.error(error.message || t("error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center w-full">
            <form
                onSubmit={handleRegister}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            >
                <h1 className="text-2xl font-semibold text-center">{t("title")}</h1>

                <div className="space-y-3">
                    <Input
                        placeholder={t("name")}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <Input
                        placeholder={t("email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        placeholder={t("password")}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                        placeholder={t("confirmPassword")}
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full mt-4"
                    disabled={loading}
                >
                    {loading ? t("loading") : t("button")}
                </Button>

                <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-300">
                    {t("haveAccount")}{" "}
                    <span
                        className="text-blue-500 cursor-pointer hover:underline"
                        onClick={() => router.push("/login")}
                    >
                        {t("loginLink")}
                    </span>
                </p>
            </form>
        </div>
    );
}
