import { listingRules } from "@/lib/compliance";

// Accepts spaces, dashes and dots typed by people; returns digits only.
export function normalizeMicrochip(input: string): string {
    return input.replace(/[\s.-]+/g, "");
}

export function isValidMicrochip(digits: string): boolean {
    return new RegExp(`^[0-9]{${listingRules.microchipDigits}}$`).test(digits);
}

export function requiresMicrochip(species: string): boolean {
    return (listingRules.microchipRequiredSpecies as readonly string[]).includes(species);
}

export function ageInDays(birthDate: string, today: Date = new Date()): number {
    const birth = Date.parse(`${birthDate}T00:00:00Z`);
    const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return Math.floor((now - birth) / 86_400_000);
}

export function isOldEnough(birthDate: string, today: Date = new Date()): boolean {
    return ageInDays(birthDate, today) >= listingRules.minAgeDays;
}

export type PhotoMime = "image/jpeg" | "image/png" | "image/webp";

// The type is decided from the file signature, never from the client-provided name or MIME type.
export function detectPhotoMime(bytes: Uint8Array): PhotoMime | null {
    const startsWith = (signature: number[], offset = 0) =>
        signature.every((byte, index) => bytes[offset + index] === byte);

    if (startsWith([0xff, 0xd8, 0xff])) {
        return "image/jpeg";
    }
    if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return "image/png";
    }
    if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
        return "image/webp";
    }
    return null;
}
