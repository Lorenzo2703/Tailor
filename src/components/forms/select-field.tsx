type Option = { value: string; label: string };

export function SelectField({
    id,
    name,
    label,
    options,
    defaultValue,
    error,
    hint,
    required = false,
    placeholder,
}: {
    id: string;
    name: string;
    label: string;
    options: readonly Option[];
    defaultValue?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    placeholder?: string;
}) {
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div className="auth-field">
            <label className="auth-label" htmlFor={id}>
                {label}
            </label>
            <select
                id={id}
                name={name}
                className="auth-input"
                defaultValue={defaultValue ?? ""}
                required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
            >
                {placeholder ? (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                ) : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
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

export function CheckboxField({
    id,
    name,
    label,
    defaultChecked,
}: {
    id: string;
    name: string;
    label: string;
    defaultChecked?: boolean;
}) {
    return (
        <label className="auth-option" htmlFor={id}>
            <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} />
            <span className="auth-option-title">{label}</span>
        </label>
    );
}
