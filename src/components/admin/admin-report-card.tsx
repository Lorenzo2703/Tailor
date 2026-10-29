"use client";

import { useState, useTransition } from "react";
import { resolveReport } from "@/server/actions/reports";
import { reportContent } from "@/lib/content/reports";

interface AdminReportCardProps {
    report: {
        id: string;
        listing_id: string;
        reason: string;
        details: string | null;
        status: string;
        created_at: string;
        reporter: { id: string; display_name: string | null } | null;
        listing: {
            id: string;
            status: string;
            animal: { id: string; name: string; species: string; city: string } | null;
        } | null;
    };
}

export function AdminReportCard({ report }: AdminReportCardProps) {
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const { admin, reasons } = reportContent;

    const handleAction = (status: "resolved_takedown" | "dismissed", takedown: boolean) => {
        if (takedown && !window.confirm(admin.confirmPrompt)) {
            return;
        }

        startTransition(async () => {
            setError(null);
            const formData = new FormData();
            formData.set("reportId", report.id);
            formData.set("status", status);
            formData.set("takedownListing", takedown ? "true" : "false");
            formData.set("notes", notes);

            const res = await resolveReport(formData);
            if (res && "error" in res && res.error) {
                setError(res.error);
            }
        });
    };

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                        {reasons[report.reason as keyof typeof reasons] ?? report.reason}
                    </span>
                    <span className="text-xs text-neutral-500">
                        {new Date(report.created_at).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </span>
                </div>
                <div className="text-xs text-neutral-600">
                    Segnalato da: <span className="font-medium">{report.reporter?.display_name ?? "Anonimo"}</span>
                </div>
            </div>

            <div className="mt-3">
                <p className="text-sm text-neutral-800 italic">"{report.details}"</p>
                {report.listing && (
                    <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
                        Annuncio:{" "}
                        <span className="font-semibold text-neutral-900">
                            {report.listing.animal?.name} ({report.listing.animal?.city})
                        </span>{" "}
                        • Stato attuale: <span className="font-medium">{report.listing.status}</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            {report.status === "pending" && (
                <div className="mt-4 border-t border-neutral-100 pt-3">
                    <input
                        type="text"
                        placeholder={admin.notesPlaceholder}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mb-3 block w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => handleAction("dismissed", false)}
                            disabled={isPending}
                            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                        >
                            {admin.dismissAction}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction("resolved_takedown", true)}
                            disabled={isPending}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {admin.takedownAction}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
