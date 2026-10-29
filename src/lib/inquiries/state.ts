export type InquiryFormState = {
    status: "idle" | "error" | "success";
    message?: string;
    fieldErrors?: Partial<Record<string, string[]>>;
    // Kept so the text is not lost after an error.
    values?: { message?: string };
    attempt: number;
};

export const initialInquiryFormState: InquiryFormState = { status: "idle", attempt: 0 };
