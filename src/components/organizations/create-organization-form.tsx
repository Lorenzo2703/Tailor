"use client";

import { useActionState } from "react";
import { TextField } from "@/components/forms/text-field";
import { organizationContent } from "@/lib/content/organizations";
import { initialOrganizationFormState } from "@/lib/organizations/state";
import { createOrganization } from "@/server/actions/organizations";

const { fields, new: copy } = organizationContent;

export function CreateOrganizationForm() {
    const [state, action, pending] = useActionState(createOrganization, initialOrganizationFormState);
    const errorOf = (name: string) => state.fieldErrors?.[name]?.[0];
    const value = (name: string, fallback = "") => state.values?.[name] ?? fallback;

    return (
        <form action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}

            <h2 className="auth-section-title">{copy.sections.public}</h2>

            <fieldset className="auth-fieldset">
                <legend className="auth-label">{fields.type}</legend>
                {(["shelter", "association"] as const).map((type) => (
                    <label key={type} className="auth-option">
                        <input
                            type="radio"
                            name="type"
                            value={type}
                            defaultChecked={value("type", "shelter") === type}
                            required
                        />
                        <span className="auth-option-title">{organizationContent.types[type]}</span>
                    </label>
                ))}
                {errorOf("type") ? <p className="auth-field-error">{errorOf("type")}</p> : null}
            </fieldset>

            <TextField id="org-name" name="name" label={fields.name} required maxLength={120}
                defaultValue={value("name")} error={errorOf("name")} />
            <TextField id="org-region" name="region" label={fields.region} required maxLength={80}
                defaultValue={value("region", "Lazio")} error={errorOf("region")} />
            <TextField id="org-city" name="city" label={fields.city} required maxLength={80}
                autoComplete="address-level2" defaultValue={value("city")} error={errorOf("city")} />
            <TextField id="org-description" name="description" label={fields.description} multiline
                optionalLabel={fields.optional} hint={fields.descriptionHint} maxLength={2000}
                defaultValue={value("description")} error={errorOf("description")} />

            <h2 className="auth-section-title">{copy.sections.private}</h2>
            <p className="auth-hint">{copy.privateHint}</p>

            <TextField id="org-legal" name="legalName" label={fields.legalName} optionalLabel={fields.optional}
                maxLength={200} defaultValue={value("legalName")} error={errorOf("legalName")} />
            <TextField id="org-registration" name="registrationNumber" label={fields.registrationNumber}
                optionalLabel={fields.optional} maxLength={80} defaultValue={value("registrationNumber")}
                error={errorOf("registrationNumber")} />
            <TextField id="org-email" name="contactEmail" type="email" label={fields.contactEmail}
                optionalLabel={fields.optional} autoComplete="email" maxLength={200}
                defaultValue={value("contactEmail")} error={errorOf("contactEmail")} />
            <TextField id="org-phone" name="contactPhone" type="tel" label={fields.contactPhone}
                optionalLabel={fields.optional} autoComplete="tel" maxLength={40}
                defaultValue={value("contactPhone")} error={errorOf("contactPhone")} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? copy.submitting : copy.submit}
            </button>
        </form>
    );
}
