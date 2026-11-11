"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ListingFormState } from "@/lib/listings/state";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { finishListingPhotoUpload, uploadListingPhoto } from "@/server/actions/listings";

const { fields, photos } = listingContent;

export function PhotoUploadForm({ listingId, maxFiles }: { listingId: string; maxFiles: number }) {
    const router = useRouter();
    const [state, setState] = useState<ListingFormState>(initialListingFormState);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [altTexts, setAltTexts] = useState<string[]>([]);
    const [pending, startTransition] = useTransition();
    const fileError = state.fieldErrors?.file?.[0];
    const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.currentTarget.files ?? []);
        setSelectedFiles(files);
        setAltTexts(files.map(() => ""));
        setState(initialListingFormState);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (selectedFiles.length === 0) {
            setState({
                ...initialListingFormState,
                status: "error",
                message: listingContent.errors.fileMissing,
                fieldErrors: { file: [listingContent.errors.fileMissing] },
            });
            return;
        }
        if (selectedFiles.length > maxFiles) {
            setState({
                ...initialListingFormState,
                status: "error",
                message: listingContent.errors.photoLimit,
                fieldErrors: { file: [listingContent.errors.photoLimit] },
            });
            return;
        }
        const missingAltText = altTexts.findIndex((value) => value.trim().length < 3 || value.trim().length > 300);
        if (missingAltText !== -1) {
            setState({
                ...initialListingFormState,
                status: "error",
                message: listingContent.errors.altText,
                fieldErrors: { [`altText-${missingAltText}`]: [listingContent.errors.altText] },
            });
            return;
        }

        startTransition(async () => {
            let result = state;
            let uploaded = 0;
            try {
                for (const [index, file] of selectedFiles.entries()) {
                    const formData = new FormData();
                    formData.set("file", file);
                    formData.set("altText", altTexts[index]);
                    result = await uploadListingPhoto(listingId, result, formData);
                    if (result.status === "error") {
                        break;
                    }
                    uploaded += 1;
                    setState(result);
                }

                if (uploaded > 0) {
                    const refreshed = await finishListingPhotoUpload(listingId, uploaded);
                    if (refreshed.status === "error") {
                        setState(refreshed);
                    } else if (result.status === "error") {
                        setState({
                            ...result,
                            message: `${photos.added(uploaded)} ${result.message}`,
                            fieldErrors: undefined,
                        });
                    } else {
                        setState({ ...refreshed, message: photos.added(uploaded) });
                        router.push(`/my-animals/${listingId}?step=5`);
                    }
                    if (result.status === "success" && refreshed.status === "success") {
                        setSelectedFiles([]);
                        setAltTexts([]);
                    } else {
                        setSelectedFiles((files) => files.slice(uploaded));
                        setAltTexts((values) => values.slice(uploaded));
                    }
                } else {
                    setState(result);
                }
            } catch {
                setState({
                    status: "error",
                    message: listingContent.errors.generic,
                    attempt: result.attempt + 1,
                });
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="auth-form" noValidate>
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
                    name="files"
                    type="file"
                    className="auth-input"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={onFilesChange}
                    aria-invalid={fileError ? true : undefined}
                    aria-describedby={fileError ? "photo-file-error" : "photo-file-hint"}
                    required
                />
                {fileError ? (
                    <p id="photo-file-error" className="auth-field-error">{fileError}</p>
                ) : (
                    <p id="photo-file-hint" className="auth-hint">
                        {fields.photoHint} {photos.selectHint(maxFiles)}
                    </p>
                )}
            </div>

            {selectedFiles.map((file, index) => {
                const id = `photo-alt-${index}`;
                const error = state.fieldErrors?.[`altText-${index}`]?.[0];
                return (
                    <div className="auth-field" key={`${file.name}-${file.lastModified}-${index}`}>
                        <label className="auth-label" htmlFor={id}>
                            {fields.altText}: {file.name}
                        </label>
                        <input
                            id={id}
                            name="altTexts"
                            type="text"
                            className="auth-input"
                            value={altTexts[index] ?? ""}
                            maxLength={300}
                            required
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${id}-error` : `${id}-hint`}
                            onChange={(event) => {
                                const next = [...altTexts];
                                next[index] = event.currentTarget.value;
                                setAltTexts(next);
                            }}
                        />
                        {error ? (
                            <p id={`${id}-error`} className="auth-field-error">{error}</p>
                        ) : (
                            <p id={`${id}-hint`} className="auth-hint">{fields.altTextHint}</p>
                        )}
                    </div>
                );
            })}

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? photos.adding : photos.add}
            </button>
        </form>
    );
}
