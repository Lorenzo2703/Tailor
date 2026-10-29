"use client";

import { useActionState } from "react";
import { TextField } from "@/components/forms/text-field";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { uploadListingPhoto } from "@/server/actions/listings";

const { fields, photos } = listingContent;

export function PhotoUploadForm({ listingId }: { listingId: string }) {
    const [state, action, pending] = useActionState(uploadListingPhoto.bind(null, listingId), initialListingFormState);
    const fileError = state.fieldErrors?.file?.[0];
    const altError = state.fieldErrors?.altText?.[0];

    return (
        // The key remounts the form after each attempt so the file input and alt text are cleared.
        <form key={state.attempt} action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">{state.message}</p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-alert" data-tone="success" role="status">{state.message}</p>
            ) : null}

            <div className="auth-field">
                <label className="auth-label" htmlFor="photo-file">
                    {fields.photo}
                </label>
                <input
                    id="photo-file"
                    name="file"
                    type="file"
                    className="auth-input"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    aria-invalid={fileError ? true : undefined}
                    aria-describedby={fileError ? "photo-file-error" : "photo-file-hint"}
                    required
                />
                {fileError ? (
                    <p id="photo-file-error" className="auth-field-error">{fileError}</p>
                ) : (
                    <p id="photo-file-hint" className="auth-hint">{fields.photoHint}</p>
                )}
            </div>

            <TextField id="photo-alt" name="altText" label={fields.altText} required hint={fields.altTextHint}
                maxLength={300} error={altError} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? photos.adding : photos.add}
            </button>
        </form>
    );
}
