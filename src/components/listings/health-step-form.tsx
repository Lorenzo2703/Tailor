"use client";

import { useActionState } from "react";
import { CheckboxField, RadioPillsField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { requiresMicrochip } from "@/lib/listings/rules";
import { saveHealthStep } from "@/server/actions/listings";

const { fields } = listingContent;

type Defaults = {
    species: string;
    vaccinated: boolean;
    sterilized: boolean;
    healthNotes: string;
    origin: string;
    microchip: string;
};

export function HealthStepForm({ listingId, defaults }: { listingId: string; defaults: Defaults }) {
    const [state, action, pending] = useActionState(saveHealthStep.bind(null, listingId), initialListingFormState);
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

            <RadioPillsField id="health-origin" name="origin" label={fields.origin} required
                options={Object.entries(listingContent.origins).map(([value, label]) => ({ value, label }))}
                defaultValue={values.origin} error={errorOf("origin")} />

            <fieldset className="health-chip-fieldset" aria-describedby="health-selection-hint">
                <legend className="auth-label">{listingContent.steps.health}</legend>
                <p className="auth-hint" id="health-selection-hint">{fields.healthSelectionHint}</p>
                <div className="health-chips">
                    <CheckboxField id="health-vaccinated" name="vaccinated" label={fields.vaccinated}
                        variant="chip" defaultChecked={defaults.vaccinated} />
                    <CheckboxField id="health-sterilized" name="sterilized" label={fields.sterilized}
                        variant="chip" defaultChecked={defaults.sterilized} />
                </div>
            </fieldset>

            <TextField id="health-notes" name="healthNotes" label={fields.healthNotes} multiline
                optionalLabel={fields.optional} hint={fields.healthNotesHint} maxLength={2000}
                defaultValue={values.healthNotes} error={errorOf("healthNotes")} />

            <TextField id="health-chip" name="microchip" label={fields.microchip}
                required={requiresMicrochip(defaults.species)}
                optionalLabel={fields.optional} hint={fields.microchipHint} maxLength={40}
                defaultValue={values.microchip} error={errorOf("microchip")} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? listingContent.saving : listingContent.saveAndContinue}
            </button>
        </form>
    );
}
