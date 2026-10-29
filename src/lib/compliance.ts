// TO BE REVIEWED BY A LAWYER: every rule in this file. Legal rules live here, not in components.

export const organizationVerification = {
    // TO BE REVIEWED BY A LAWYER: which documents prove that a shelter/association is legitimate.
    documentTypes: ["registration", "statute", "other"] as const,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"] as const,
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxDocumentsPerOrganization: 10,
    maxOrganizationsPerUser: 3,
    // Self-service registration is limited to these types; breeders need the ENABLE_BREEDERS flag.
    selfServiceTypes: ["shelter", "association"] as const,
} as const;

export type OrganizationDocumentType = (typeof organizationVerification.documentTypes)[number];
export type AllowedDocumentMime = (typeof organizationVerification.allowedMimeTypes)[number];

// TO BE REVIEWED BY A LAWYER. The database (public.compliance_rules()) is the source of truth;
// these values only drive hints and form validation and must be kept in sync with it.
export const listingRules = {
    minAgeDays: 60,
    microchipRequiredSpecies: ["dog"] as const,
    microchipDigits: 15,
    maxActivePrivateAnimals: 5,
    listingDays: 90,
    minStoryLength: 30,
    maxPhotos: 8,
    maxPhotoInputBytes: 10 * 1024 * 1024,
    // Private individuals can only give animals away; paid sales stay behind ENABLE_SALE.
    privateListingTypes: ["gift"] as const,
} as const;

export const animalOrigins = ["stray_rescued", "surrendered_by_owner", "family_pet", "home_litter"] as const;
export type AnimalOrigin = (typeof animalOrigins)[number];
