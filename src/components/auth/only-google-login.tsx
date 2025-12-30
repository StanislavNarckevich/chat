"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { GoogleLoginButton } from "@/components/auth/google-login";

export interface OnlyGoogleLoginProps {
    setMode: (mode: "email" | "phone") => void;
}

export function OnlyGoogleLogin({ setMode }: OnlyGoogleLoginProps) {
    const t = useTranslations("login");

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-center">{t("title")}</h1>

            <div className="mt-6 relative">
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
        </div>
    );
}