// src/lib/roles.ts

export type UserRole = "admin" | "manager" | "client" | "developer" | "bank" | "insurance";

export const ROLE_PERMISSIONS = {
    admin: ["*"],
    manager: ["createRoom", "manageParticipants", "deleteMessages"],
    client: ["sendMessage", "uploadFile"],
    developer: ["sendMessage", "uploadFile"],
    bank: ["sendMessage", "uploadFile"],
    insurance: ["sendMessage", "uploadFile"],
} as const;
