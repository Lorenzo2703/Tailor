import Link from "next/link";
import { SelectField } from "@/components/forms/select-field";
import { publicContent } from "@/lib/content/public";
import { hasActiveFilters } from "@/lib/search-params";
import type { SearchFilters } from "@/server/queries/public";

const { filters: copy } = publicContent;

const options = (labels: Record<string, string>) =>
    [{ value: "", label: copy.any }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))];

// A plain GET form: it works without JavaScript and every result page has a shareable URL.
export function SearchFiltersForm({ filters, action }: { filters: SearchFilters; action: string }) {
    return (
        <form method="get" action={action} className="pub-filters" role="search" aria-label={copy.title}>
            <div className="auth-field">
                <label className="auth-label" htmlFor="f-q">
                    {copy.query}
                </label>
                <input id="f-q" name="q" type="search" className="auth-input" maxLength={80}
                    placeholder={copy.queryPlaceholder} defaultValue={filters.query} />
            </div>

            <SelectField id="f-species" name="species" label={copy.species}
                options={options(publicContent.species)}
                defaultValue={filters.species ?? ""} />
            <SelectField id="f-size" name="size" label={copy.size}
                options={options(publicContent.sizes)}
                defaultValue={filters.size ?? ""} />
            <SelectField id="f-sex" name="sex" label={copy.sex}
                options={options(publicContent.sexes)} defaultValue={filters.sex ?? ""} />

            <div className="auth-field">
                <label className="auth-label" htmlFor="f-city">
                    {copy.city}
                </label>
                <input id="f-city" name="city" type="text" className="auth-input" maxLength={80}
                    autoComplete="address-level2" placeholder={copy.cityPlaceholder} defaultValue={filters.city} />
            </div>
            <SelectField id="f-radius" name="radius" label={`${copy.radius} (${copy.radiusUnit})`}
                options={[10, 25, 50, 100].map((km) => ({ value: String(km), label: `${km} ${copy.radiusUnit}` }))}
                defaultValue={String(filters.radiusKm ?? 25)} />

            <fieldset className="auth-fieldset">
                <legend className="auth-label">{copy.traits}</legend>
                {(
                    [
                        ["kids", copy.kids, filters.kids],
                        ["dogs", copy.dogs, filters.dogs],
                        ["cats", copy.cats, filters.cats],
                        ["apartment", copy.apartment, filters.apartment],
                    ] as const
                ).map(([name, label, checked]) => (
                    <label key={name} className="auth-option" htmlFor={`f-${name}`}>
                        <input id={`f-${name}`} type="checkbox" name={name} value="1" defaultChecked={Boolean(checked)} />
                        <span className="auth-option-title">{label}</span>
                    </label>
                ))}
            </fieldset>

            <button type="submit" className="auth-button">
                {copy.apply}
            </button>
            {hasActiveFilters(filters) ? (
                <Link className="pub-link" href={action}>
                    {copy.reset}
                </Link>
            ) : null}
        </form>
    );
}
