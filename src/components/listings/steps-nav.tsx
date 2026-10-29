import Link from "next/link";
import { listingContent } from "@/lib/content/listings";

const stepKeys = ["animal", "health", "story", "photos", "review"] as const;

export function StepsNav({ listingId, current }: { listingId: string; current: number }) {
    return (
        <nav aria-label="Passi dell'annuncio" style={{ marginTop: "1.5rem" }}>
            <ol className="auth-list" style={{ borderTop: 0 }}>
                {stepKeys.map((key, index) => {
                    const step = index + 1;
                    return (
                        <li key={key} style={{ minHeight: "2.75rem", paddingBlock: "0.35rem" }}>
                            <Link
                                className="auth-link"
                                href={`/my-animals/${listingId}?step=${step}`}
                                aria-current={step === current ? "step" : undefined}
                                style={step === current ? undefined : { color: "var(--shell-muted)", fontWeight: 500 }}
                            >
                                {step}. {listingContent.steps[key]}
                            </Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
