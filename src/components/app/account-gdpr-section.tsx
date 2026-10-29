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
        <section aria-labelledby="gdpr-heading" className="mt-10 border-t border-neutral-200 pt-8">
            <h2 id="gdpr-heading" className="text-lg font-bold text-neutral-900">
                Privacy & Gestione Dati (GDPR)
            </h2>

            {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {error}
                </div>
            )}

            {/* Export */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/50 p-5">
                <h3 className="font-semibold text-neutral-900">{gdpr.exportTitle}</h3>
                <p className="mt-1 text-sm text-neutral-600">{gdpr.exportDescription}</p>
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="mt-4 inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 disabled:opacity-50"
                >
                    {isExporting ? "Generazione archivio..." : gdpr.exportButton}
                </button>
            </div>

            {/* Delete Account */}
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50/30 p-5">
                <h3 className="font-semibold text-red-900">{gdpr.deleteTitle}</h3>
                <p className="mt-1 text-sm text-red-800">{gdpr.deleteDescription}</p>
                <p className="mt-2 text-xs font-semibold text-red-700">{gdpr.deleteWarning}</p>

                <form onSubmit={handleDelete} className="mt-4 max-w-sm space-y-3">
                    <label htmlFor="confirm-del" className="block text-xs font-medium text-neutral-700">
                        {gdpr.deleteConfirmationPrompt}
                    </label>
                    <input
                        id="confirm-del"
                        type="text"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="ELIMINA"
                        className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-2xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                        type="submit"
                        disabled={confirmation !== "ELIMINA" || isDeleting}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-2xs hover:bg-red-700 disabled:opacity-40"
                    >
                        {isDeleting ? "Eliminazione..." : gdpr.deleteButton}
                    </button>
                </form>
            </div>
        </section>
    );
}
