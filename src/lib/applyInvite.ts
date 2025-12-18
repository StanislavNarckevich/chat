export const applyInvite = async (user: any, inviteId: string | null) => {
    try {
        if (!inviteId) return null;
        const idToken = await user.getIdToken();
        const res = await fetch("/api/invite/apply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ inviteId }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.warn("invite apply failed", data);
            return null;
        }
        // remove saved invite
        if (typeof window !== "undefined") localStorage.removeItem("inviteId");
        return data.roomId;
    } catch (err) {
        console.error("applyInvite error", err);
        return null;
    }
};
