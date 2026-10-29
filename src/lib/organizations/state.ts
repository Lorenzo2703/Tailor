export type OrganizationFormState = {
    status: "idle" | "error" | "success";
    message?: string;
    fieldErrors?: Partial<Record<string, string[]>>;
    // Non-sensitive values kept so the form is not wiped after an error.
    values?: Record<string, string>;
    attempt: number;
};

export const initialOrganizationFormState: OrganizationFormState = { status: "idle", attempt: 0 };
