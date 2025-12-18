// hooks/useRequireAuth.ts
import { useEffect } from "react";
import { useAuthContext } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
    const { user, loading: authLoading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    return { user, authLoading };
}
