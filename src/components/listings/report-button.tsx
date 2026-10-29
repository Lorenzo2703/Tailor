"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { reportContent, reportReasons, type ReportReason } from "@/lib/content/reports";
import { submitReport } from "@/server/actions/reports";

interface ReportButtonProps {
    listingId: string;
    className?: string;
}

export function ReportButton({ listingId, className = "" }: ReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<ReportReason>("suspected_scam");
    const [details, setDetails] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const { modal, reasons } = reportContent;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.set("listingId", listingId);
            formData.set("reason", reason);
            formData.set("details", details);

            const res = await submitReport(formData);
            if (res && "error" in res && res.error) {
                setError(res.error);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                setDetails("");
            }, 2000);
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600 ${className}`}
            >
                <Flag className="h-3.5 w-3.5" />
                <span>{modal.triggerButton}</span>
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-modal-title"
                >
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Chiudi finestra"
                            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 id="report-modal-title" className="text-lg font-bold text-neutral-900">
                            {modal.title}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-600">{modal.subtitle}</p>

                        {success ? (
                            <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                                {modal.success}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="report-reason"
                                        className="block text-xs font-semibold text-neutral-700"
                                    >
                                        {modal.reasonLabel}
                                    </label>
                                    <select
                                        id="report-reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value as ReportReason)}
                                        className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    >
                                        {reportReasons.map((key) => (
                                            <option key={key} value={key}>
                                                {reasons[key]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="report-details"
                                        className="block text-xs font-semibold text-neutral-700"
                                    >
                                        {modal.detailsLabel}
                                    </label>
                                    <textarea
                                        id="report-details"
                                        rows={3}
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder={modal.detailsPlaceholder}
                                        className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    />
                                </div>

                                <div className="mt-5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                        {modal.cancelButton}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending || details.trim().length < 10}
                                        className="inline-flex items-center rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xs hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isPending ? "Invio in corso..." : modal.submitButton}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
