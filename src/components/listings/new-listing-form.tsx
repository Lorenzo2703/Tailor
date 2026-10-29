"use client";

import { useActionState } from "react";
import { SelectField } from "@/components/forms/select-field";
import { AnimalBasicsFields } from "@/components/listings/animal-basics-fields";
import { listingContent } from "@/lib/content/listings";
import { initialListingFormState } from "@/lib/listings/state";
import { createListingDraft } from "@/server/actions/listings";

const { fields } = listingContent;

type OwnerOption = { id: string; name: string };

export function NewListingForm({ organizations }: { organizations: OwnerOption[] }) {
    const [state, action, pending] = useActionState(createListingDraft, initialListingFormState);
    const errorOf = (name: string) => state.fieldErrors?.[name]?.[0];
    const values = state.values ?? {};

    const ownerOptions = [
        { value: "personal", label: fields.ownerPersonal },
        ...organizations.map((organization) => ({
            value: organization.id,
            label: `${fields.ownerOrg} ${organization.name}`,
        })),
    ];

    return (
        <form action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}

            <SelectField id="listing-owner" name="owner" label={fields.owner} required
                options={ownerOptions} defaultValue={values.owner ?? "personal"} error={errorOf("owner")} />
            <SelectField id="listing-type" name="listingType" label={fields.type} required
                options={[
                    { value: "gift", label: listingContent.types.gift },
                    { value: "adoption", label: listingContent.types.adoption },
                ]}
                defaultValue={values.listingType ?? "gift"} error={errorOf("listingType")}
                hint="I privati possono solo affidare gratuitamente." />

            <AnimalBasicsFields values={values} errorOf={errorOf} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? listingContent.saving : listingContent.saveAndContinue}
            </button>
        </form>
    );
}
