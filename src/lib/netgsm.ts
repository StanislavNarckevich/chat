// src/lib/netgsm.ts

export async function sendSms(phone: string, message: string) {
    console.log(`[NetGSM] SMS to ${phone}: ${message}`);
    return true;
}
