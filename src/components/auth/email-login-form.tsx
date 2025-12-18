"use client";

import {useEffect, useState} from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { GoogleLoginButton } from "@/components/auth/google-login";
import { saveUserToFirestore } from "@/lib/save-user-to-firestore";
import {useGlobalLoader} from "@/providers/global-loader-provider";
import {useSearchParams} from "next/navigation";

export interface EmailLoginFormProps {
    setMode: (mode: "email" | "phone") => void;
}

export function EmailLoginForm({ setMode }: EmailLoginFormProps) {
    const t = useTranslations("login");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { setGlobalLoading } = useGlobalLoader();

    const searchParams = useSearchParams();
    const queryString = searchParams.toString(); // например: inviteId=123&ref=abc
    const registerHref = queryString ? `/register?${queryString}` : "/register";

    const isValidEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!email || !password) {
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

        try {
            setLoading(true);
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            await saveUserToFirestore(user);

            toast.success(t("welcome"));
            router.push("/rooms");
        } catch (error: any) {
            toast.error(error.message || t("error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setGlobalLoading(loading);
    }, [loading]);

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <h1 className="text-2xl font-semibold text-center">{t("title")}</h1>

            <div className="space-y-3">
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

                <Link
                    href="/reset-password"
                    className="text-blue-500 p-0 text-sm cursor-pointer"
                >
                    {t("forgotPassword")}
                </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("loading") : t("button")}
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-3">
                {t("noAccount")}{" "}
                <Link href={registerHref} className="text-blue-500 hover:underline">
                    {t("registerLink")}
                </Link>
            </p>

            <div className="mt-6 relative">
                <div className="flex items-center justify-center">
                    <div className="w-full border-t border-gray-300" />
                    <span className="mx-3 text-gray-500 text-sm">{t("or")}</span>
                    <div className="w-full border-t border-gray-300" />
                </div>

                <div className="mt-4">
                    <GoogleLoginButton />
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => setMode("phone")}
            >
                {t("loginWithPhone")}
            </Button>
        </form>
    );
}