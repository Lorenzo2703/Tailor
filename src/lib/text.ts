// Mirrors public.slugify() in the database: both must produce the same slug for the same text.
export function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/[àáâä]/g, "a")
        .replace(/[èéêë]/g, "e")
        .replace(/[ìíîï]/g, "i")
        .replace(/[òóôö]/g, "o")
        .replace(/[ùúûü]/g, "u")
        .replace(/ç/g, "c")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, max: number): string {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) {
        return clean;
    }
    const cut = clean.slice(0, max - 1);
    return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

// "2 anni e 3 mesi", "5 mesi", "3 settimane" from an ISO birth date.
export function formatAge(birthDate: string, today: Date = new Date()): string {
    const birth = new Date(`${birthDate}T00:00:00Z`);
    let months =
        (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (today.getUTCMonth() - birth.getUTCMonth());
    if (today.getUTCDate() < birth.getUTCDate()) {
        months -= 1;
    }
    if (months < 1) {
        const weeks = Math.max(1, Math.floor((today.getTime() - birth.getTime()) / (7 * 86_400_000)));
        return weeks === 1 ? "1 settimana" : `${weeks} settimane`;
    }
    if (months < 24) {
        return months === 1 ? "1 mese" : `${months} mesi`;
    }
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const yearsText = years === 1 ? "1 anno" : `${years} anni`;
    if (rest === 0) {
        return yearsText;
    }
    return `${yearsText} e ${rest === 1 ? "1 mese" : `${rest} mesi`}`;
}
