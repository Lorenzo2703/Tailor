export type ListingFormState = {
    status: "idle" | "error" | "success";
    message?: string;
    issues?: string[];
    fieldErrors?: Partial<Record<string, string[]>>;
    // Non-sensitive values kept so the form is not wiped after an error.
    values?: Record<string, string>;
    attempt: number;
};

export const initialListingFormState: ListingFormState = { status: "idle", attempt: 0 };
