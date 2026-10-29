export type AuthFormState = {
    status: "idle" | "error" | "success";
    message?: string;
    fieldErrors?: Partial<Record<string, string[]>>;
    // Non-sensitive values, kept so the form is not wiped after an error.
    values?: { email?: string; displayName?: string; accountType?: string };
    // Incremented on every submission so the CAPTCHA widget can be reset.
    attempt: number;
};

export const initialAuthFormState: AuthFormState = { status: "idle", attempt: 0 };
