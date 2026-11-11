"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { publicContent } from "@/lib/content/public";
import { hasActiveFilters } from "@/lib/search-params";
import type { SearchFilters } from "@/server/queries/public";

const { filters: copy } = publicContent;

const options = (labels: Record<string, string>) =>
    [{ value: "", label: copy.any }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))];

// A plain GET form: it works without JavaScript and every result page has a shareable URL.
export function SearchFiltersForm({ filters, action }: { filters: SearchFilters; action: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasFilters = hasActiveFilters(filters);

    return (
        <form method="get" action={action} className="pub-filters" role="search" aria-label={copy.title}>
            <div className="pub-filter-toolbar">
                <div className="pub-filter-search-control">
                    <label className="sr-only" htmlFor="f-q">{copy.query}</label>
                    <Search aria-hidden="true" />
                    <input
                        id="f-q"
                        name="q"
                        type="search"
                        className="auth-input"
                        maxLength={80}
                        placeholder={copy.queryPlaceholder}
                        defaultValue={filters.query}
                    />
                </div>
                <Button type="submit" variant="outline" size="icon-lg" aria-label="Cerca animali">
                    <Search aria-hidden="true" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="pub-filter-toggle"
                    aria-label={isExpanded ? "Nascondi filtri" : "Mostra filtri"}
                    aria-expanded={isExpanded}
                    aria-controls="pub-filter-options"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                >
                    <SlidersHorizontal aria-hidden="true" />
                    {hasFilters ? <span className="pub-filter-active-mark" aria-hidden="true" /> : null}
                </Button>
                {hasFilters ? (
                    <Link className="pub-filter-reset" href={action} aria-label={copy.reset} title={copy.reset}>
                        <RotateCcw aria-hidden="true" />
                    </Link>
                ) : null}
            </div>

            <div id="pub-filter-options" className="pub-filter-content" hidden={!isExpanded}>
                <div className="pub-filter-attributes">
                    <SelectField id="f-species" name="species" label={copy.species}
                        options={options(publicContent.species)}
                        defaultValue={filters.species ?? ""} />
                    <SelectField id="f-size" name="size" label={copy.size}
                        options={options(publicContent.sizes)}
                        defaultValue={filters.size ?? ""} />
                    <SelectField id="f-sex" name="sex" label={copy.sex}
                        options={options(publicContent.sexes)} defaultValue={filters.sex ?? ""} />
                </div>

                <div className="pub-filter-location">
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="f-city">
                            {copy.city}
                        </label>
                        <input
                            id="f-city"
                            name="city"
                            type="text"
                            className="auth-input"
                            maxLength={80}
                            autoComplete="address-level2"
                            placeholder={copy.cityPlaceholder}
                            defaultValue={filters.city}
                        />
                    </div>
                    <SelectField id="f-radius" name="radius" label={`${copy.radius} (${copy.radiusUnit})`}
                        options={[10, 25, 50, 100].map((km) => ({ value: String(km), label: `${km} ${copy.radiusUnit}` }))}
                        defaultValue={String(filters.radiusKm ?? 25)} />
                </div>

                <fieldset className="auth-fieldset pub-filter-traits">
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

                <Button type="submit" size="lg" className="pub-filter-submit">
                    {copy.apply}
                </Button>
            </div>
        </form>
    );
}
