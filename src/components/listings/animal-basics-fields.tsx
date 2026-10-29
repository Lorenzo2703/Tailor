import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { listingContent } from "@/lib/content/listings";

const { fields } = listingContent;

const toOptions = (labels: Record<string, string>) =>
    Object.entries(labels).map(([value, label]) => ({ value, label }));

export type BasicsValues = {
    name?: string;
    species?: string;
    sex?: string;
    birthDate?: string;
    size?: string;
    breed?: string;
    city?: string;
};

// Shared by the "new listing" form and the first step of the editor.
export function AnimalBasicsFields({
    values,
    errorOf,
}: {
    values: BasicsValues;
    errorOf: (name: string) => string | undefined;
}) {
    return (
        <>
            <TextField id="animal-name" name="name" label={fields.name} required maxLength={60}
                defaultValue={values.name} error={errorOf("name")} />
            <SelectField id="animal-species" name="species" label={fields.species} required
                placeholder="—" options={toOptions(listingContent.species)}
                defaultValue={values.species} error={errorOf("species")} />
            <SelectField id="animal-sex" name="sex" label={fields.sex} required
                placeholder="—" options={toOptions(listingContent.sexes)}
                defaultValue={values.sex} error={errorOf("sex")} />
            <div className="auth-field">
                <label className="auth-label" htmlFor="animal-birth">
                    {fields.birthDate}
                </label>
                <input id="animal-birth" name="birthDate" type="date" className="auth-input" required
                    defaultValue={values.birthDate}
                    aria-invalid={errorOf("birthDate") ? true : undefined}
                    aria-describedby={errorOf("birthDate") ? "animal-birth-error" : "animal-birth-hint"} />
                {errorOf("birthDate") ? (
                    <p id="animal-birth-error" className="auth-field-error">{errorOf("birthDate")}</p>
                ) : (
                    <p id="animal-birth-hint" className="auth-hint">{fields.birthDateHint}</p>
                )}
            </div>
            <SelectField id="animal-size" name="size" label={fields.size} required
                placeholder="—" options={toOptions(listingContent.sizes)}
                defaultValue={values.size} error={errorOf("size")} />
            <TextField id="animal-breed" name="breed" label={fields.breed} optionalLabel={fields.optional}
                hint={fields.breedHint} maxLength={80} defaultValue={values.breed} error={errorOf("breed")} />
            <TextField id="animal-city" name="city" label={fields.city} required maxLength={80}
                autoComplete="address-level2" defaultValue={values.city} error={errorOf("city")} />
        </>
    );
}
