// app/lib/otp.ts
import { signInWithPhoneNumber, RecaptchaVerifier, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Unified helper for sending OTPs
 * Now → Firebase SMS
 * Later → NetGSM API
 */
export async function sendOtp(phone: string, recaptcha: any) {
    return await signInWithPhoneNumber(auth, phone, recaptcha);
}

/**
 * Unified helper for OTP confirmation
 * Now → Firebase confirm()
 * Then → call /api/auth/custom-token and log in with a custom token
 */
export async function verifyOtp(confirmResult: any, code: string, role: string = "client") {
    try {
        // Verify the code via Firebase
        const result = await confirmResult.confirm(code);
        const user = result.user;
        const phone = user.phoneNumber;

        // Request a custom token with the required role from the server
        const res = await fetch("/api/auth/custom-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, role }),
        });

        if (!res.ok) {
            throw new Error("Failed to get custom token");
        }

        const data = await res.json();

        // Log in with a custom token
        await signInWithCustomToken(auth, data.token);

        return { success: true, user };
    } catch (err: any) {
        console.error("verifyOtp error:", err);
        throw new Error(err.message || "OTP verification failed");
    }
}

/**
 * Creating an invisible reCAPTCHA
 */
export function createRecaptcha() {
    return new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
    });
}
