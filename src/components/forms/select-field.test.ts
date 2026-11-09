import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckboxField } from "./select-field";

describe("CheckboxField chip variant", () => {
    it("keeps a native named checkbox and the saved checked value", () => {
        const html = renderToStaticMarkup(createElement(CheckboxField, {
            id: "health-vaccinated",
            name: "vaccinated",
            label: "Vaccinato",
            variant: "chip",
            defaultChecked: true,
        }));
        expect(html).toContain('class="health-chip health-chip-select"');
        expect(html).toContain('for="health-vaccinated"');
        expect(html).toContain('type="checkbox"');
        expect(html).toContain('name="vaccinated"');
        expect(html).toContain('checked=""');
    });

    it("keeps unselected values unchecked and preserves the default variant", () => {
        const html = renderToStaticMarkup(createElement(CheckboxField, {
            id: "health-sterilized",
            name: "sterilized",
            label: "Sterilizzato",
            defaultChecked: false,
        }));
        expect(html).toContain('class="auth-option"');
        expect(html).not.toContain('checked=""');
    });
});
