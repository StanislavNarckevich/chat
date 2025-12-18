"use client";

import {GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {FcGoogle} from "react-icons/fc";
import {useRouter, useSearchParams} from "next/navigation";
import {saveUserToFirestore} from "@/lib/save-user-to-firestore";
import {applyInvite} from "@/lib/applyInvite";
import {useEffect, useState} from "react";
import {useGlobalLoader} from "@/providers/global-loader-provider";


export function GoogleLoginButton() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteId = searchParams.get("inviteId") || (typeof window !== "undefined" ? localStorage.getItem("inviteId") : null);
    const [loading, setLoading] = useState(false);
    const {setGlobalLoading} = useGlobalLoader();

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await saveUserToFirestore(user);
            await user.getIdToken(true);

            if (inviteId) {
                const roomId = await applyInvite(user, inviteId);

                if (roomId) {
                    router.push(`/rooms/${roomId}`);
                    toast.success(`Welcome, ${user.displayName || "user"}!`);
                }
            } else {
                router.push("/rooms");
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Google login failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setGlobalLoading(loading);
    }, [loading]);

    return (
        <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-gray-300"
        >
            <FcGoogle className="text-xl"/>
            Sign in with Google
        </Button>
    );
}
