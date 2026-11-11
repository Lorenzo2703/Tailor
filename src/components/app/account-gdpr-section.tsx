"use client";

import { useTransition, useState } from "react";
import { Info } from "lucide-react";
import { favoritesContent } from "@/lib/content/favorites";
import { exportUserData, deleteAccount } from "@/server/actions/favorites";

export function AccountGdprSection() {
    const [isExporting, startExport] = useTransition();
    const [isDeleting, startDelete] = useTransition();
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [openInfo, setOpenInfo] = useState<"export" | "delete" | null>(null);

    const handleExport = () => {
        startExport(async () => {
            setError(null);
            const res = await exportUserData();
            if ("error" in res && res.error) {
                setError(res.error);
                return;
            }
            if ("data" in res && res.data) {
                const blob = new Blob([JSON.stringify(res.data, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `tailor-account-data-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    };

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        startDelete(async () => {
            setError(null);
            const formData = new FormData();
            formData.set("confirmation", confirmation);
            const res = await deleteAccount(formData);
            if ("error" in res && res.error) {
                setError(res.error);
                return;
            }
            window.location.href = "/";
        });
    };

    const { gdpr } = favoritesContent;

    return (
        <section aria-labelledby="gdpr-heading" className="account-gdpr">
            <h2 id="gdpr-heading" className="account-section-title">
                Privacy & Gestione Dati (GDPR)
            </h2>

            {error && (
                <div className="account-gdpr-error" role="alert">
                    {error}
                </div>
            )}

            <div className="account-gdpr-card">
                <div className="account-gdpr-card-heading">
                    <h3>{gdpr.exportTitle}</h3>
                    <span className="account-gdpr-info" data-open={openInfo === "export"}>
                        <button
                            type="button"
                            className="account-gdpr-info-trigger"
                            aria-label={`Informazioni: ${gdpr.exportTitle}`}
                            aria-describedby="gdpr-export-info"
                            aria-expanded={openInfo === "export"}
                            onClick={() => setOpenInfo((current) => current === "export" ? null : "export")}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") setOpenInfo(null);
                            }}
                            title="Mostra informazioni"
                        >
                            <Info aria-hidden="true" />
                        </button>
                        <span id="gdpr-export-info" className="account-gdpr-tooltip" role="tooltip">
                            {gdpr.exportDescription}
                        </span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="account-gdpr-button"
                >
                    {isExporting ? "Generazione archivio..." : gdpr.exportButton}
                </button>
            </div>

            <div className="account-gdpr-card" data-tone="danger">
                <div className="account-gdpr-card-heading">
                    <h3>{gdpr.deleteTitle}</h3>
                    <span className="account-gdpr-info" data-open={openInfo === "delete"}>
                        <button
                            type="button"
                            className="account-gdpr-info-trigger"
                            aria-label={`Informazioni: ${gdpr.deleteTitle}`}
                            aria-describedby="gdpr-delete-info"
                            aria-expanded={openInfo === "delete"}
                            onClick={() => setOpenInfo((current) => current === "delete" ? null : "delete")}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") setOpenInfo(null);
                            }}
                            title="Mostra informazioni"
                        >
                            <Info aria-hidden="true" />
                        </button>
                        <span id="gdpr-delete-info" className="account-gdpr-tooltip" role="tooltip">
                            {gdpr.deleteDescription} <strong>{gdpr.deleteWarning}</strong>
                        </span>
                    </span>
                </div>

                <form onSubmit={handleDelete} className="account-gdpr-delete-form">
                    <label htmlFor="confirm-del">
                        {gdpr.deleteConfirmationPrompt}
                    </label>
                    <input
                        id="confirm-del"
                        type="text"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="ELIMINA"
                        className="account-gdpr-input"
                    />
                    <button
                        type="submit"
                        disabled={confirmation !== "ELIMINA" || isDeleting}
                        className="account-gdpr-delete-button"
                    >
                        {isDeleting ? "Eliminazione..." : gdpr.deleteButton}
                    </button>
                </form>
            </div>
        </section>
    );
}
