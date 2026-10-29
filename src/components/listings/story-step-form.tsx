"use client";

import { useActionState } from "react";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { saveStoryStep } from "@/server/actions/listings";

const { fields } = listingContent;

type TriState = "yes" | "no" | "unknown";
type Defaults = {
    story: string;
    goodWithKids: TriState;
    goodWithDogs: TriState;
    goodWithCats: TriState;
    apartmentOk: TriState;
};

const triOptions = [
    { value: "unknown", label: "Non so" },
    { value: "yes", label: "Sì" },
    { value: "no", label: "No" },
];

export function StoryStepForm({ listingId, defaults }: { listingId: string; defaults: Defaults }) {
    const [state, action, pending] = useActionState(saveStoryStep.bind(null, listingId), initialListingFormState);
    const errorOf = (name: string) => state.fieldErrors?.[name]?.[0];
    const values = { ...defaults, ...state.values };

    return (
        <form action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">{state.message}</p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-alert" data-tone="success" role="status">{state.message}</p>
            ) : null}

            <fieldset className="auth-fieldset">
                <legend className="auth-label">{fields.traits}</legend>
                <SelectField id="trait-kids" name="goodWithKids" label={fields.goodWithKids} options={triOptions}
                    defaultValue={values.goodWithKids} />
                <SelectField id="trait-dogs" name="goodWithDogs" label={fields.goodWithDogs} options={triOptions}
                    defaultValue={values.goodWithDogs} />
                <SelectField id="trait-cats" name="goodWithCats" label={fields.goodWithCats} options={triOptions}
                    defaultValue={values.goodWithCats} />
                <SelectField id="trait-apartment" name="apartmentOk" label={fields.apartmentOk} options={triOptions}
                    defaultValue={values.apartmentOk} />
            </fieldset>

            <TextField id="story" name="story" label={fields.story} multiline required
                hint={fields.storyHint} maxLength={5000} defaultValue={values.story} error={errorOf("story")} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? listingContent.saving : listingContent.saveAndContinue}
            </button>
        </form>
    );
}
