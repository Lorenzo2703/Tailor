"use client";

import { useActionState } from "react";
import { AnimalBasicsFields, type BasicsValues } from "@/components/listings/animal-basics-fields";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { saveAnimalBasics } from "@/server/actions/listings";

export function AnimalStepForm({ listingId, defaults }: { listingId: string; defaults: BasicsValues }) {
    const [state, action, pending] = useActionState(saveAnimalBasics.bind(null, listingId), initialListingFormState);
    const errorOf = (name: string) => state.fieldErrors?.[name]?.[0];

    return (
        <form action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">{state.message}</p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-alert" data-tone="success" role="status">{state.message}</p>
            ) : null}

            <AnimalBasicsFields values={{ ...defaults, ...state.values }} errorOf={errorOf} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? listingContent.saving : listingContent.saveAndContinue}
            </button>
        </form>
    );
}
