import type { AllowedDocumentMime } from "@/lib/compliance";

// The type is decided from the file signature, never from the client-provided name or MIME type.
export function detectDocumentMime(bytes: Uint8Array): AllowedDocumentMime | null {
    const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);

    if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) {
        return "application/pdf";
    }
    if (startsWith([0xff, 0xd8, 0xff])) {
        return "image/jpeg";
    }
    if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return "image/png";
    }
    return null;
}

export const extensionByMime: Record<AllowedDocumentMime, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
};

// Keeps only a safe display name; the stored object name is always random.
export function sanitizeFileName(name: string): string {
    const cleaned = name
        .normalize("NFKC")
        .replace(/[\u0000-\u001f\u007f/\\]+/g, "")
        .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
        .trim()
        .slice(0, 120);
    return cleaned.length > 0 ? cleaned : "documento";
}
