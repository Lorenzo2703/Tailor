import { inquiryContent } from "@/lib/content/inquiries";

export function SafetyBox() {
    const { safety } = inquiryContent;
    return (
        <aside className="pub-notice" aria-labelledby="safety-title" style={{ margin: "1rem 0" }}>
            <strong id="safety-title">{safety.title}</strong>
            <ul style={{ margin: "0.5rem 0 0 1.1rem", listStyle: "disc" }}>
                {safety.items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </aside>
    );
}
