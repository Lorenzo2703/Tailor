type TextFieldProps = {
    id: string;
    name: string;
    label: string;
    type?: "text" | "email" | "tel";
    multiline?: boolean;
    hint?: string;
    error?: string;
    required?: boolean;
    optionalLabel?: string;
    autoComplete?: string;
    maxLength?: number;
    defaultValue?: string;
};

export function TextField({
    id,
    name,
    label,
    type = "text",
    multiline = false,
    hint,
    error,
    required = false,
    optionalLabel,
    autoComplete,
    maxLength,
    defaultValue,
}: TextFieldProps) {
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    const shared = {
        id,
        name,
        className: "auth-input",
        required,
        maxLength,
        defaultValue,
        autoComplete,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
    } as const;

    return (
        <div className="auth-field">
            <label className="auth-label" htmlFor={id}>
                {label}
                {!required && optionalLabel ? ` ${optionalLabel}` : ""}
            </label>
            {multiline ? <textarea {...shared} /> : <input {...shared} type={type} />}
            {error ? (
                <p id={`${id}-error`} className="auth-field-error">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="auth-hint">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
