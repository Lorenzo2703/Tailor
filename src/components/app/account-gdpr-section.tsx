"use client";

import { useTransition, useState } from "react";
import { favoritesContent } from "@/lib/content/favorites";
import { exportUserData, deleteAccount } from "@/server/actions/favorites";

export function AccountGdprSection() {
    const [isExporting, startExport] = useTransition();
    const [isDeleting, startDelete] = useTransition();
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);

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
                <h3>{gdpr.exportTitle}</h3>
                <p>{gdpr.exportDescription}</p>
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
                <h3>{gdpr.deleteTitle}</h3>
                <p>{gdpr.deleteDescription}</p>
                <p className="account-gdpr-warning">{gdpr.deleteWarning}</p>

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
