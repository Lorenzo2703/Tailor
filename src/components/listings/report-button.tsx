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
                className={`listing-report-button ${className}`}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <Flag size={16} aria-hidden="true" />
                <span>{modal.triggerButton}</span>
            </button>

            {isOpen && (
                <div
                    className="listing-report-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="report-modal-title"
                >
                    <div className="listing-report-panel">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Chiudi finestra"
                            className="listing-report-close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 id="report-modal-title" className="auth-title">
                            {modal.title}
                        </h2>
                        <p className="auth-hint">{modal.subtitle}</p>

                        {success ? (
                            <div className="auth-alert" data-tone="success">
                                {modal.success}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="auth-form">
                                {error && (
                                    <div className="auth-alert" role="alert">
                                        {error}
                                    </div>
                                )}

                                <div className="auth-field">
                                    <label
                                        htmlFor="report-reason"
                                        className="auth-label"
                                    >
                                        {modal.reasonLabel}
                                    </label>
                                    <select
                                        id="report-reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value as ReportReason)}
                                        className="auth-input"
                                    >
                                        {reportReasons.map((key) => (
                                            <option key={key} value={key}>
                                                {reasons[key]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="auth-field">
                                    <label
                                        htmlFor="report-details"
                                        className="auth-label"
                                    >
                                        {modal.detailsLabel}
                                    </label>
                                    <textarea
                                        id="report-details"
                                        rows={3}
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder={modal.detailsPlaceholder}
                                        className="auth-input"
                                    />
                                </div>

                                <div className="listing-report-actions">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="auth-button"
                                        data-variant="secondary"
                                    >
                                        {modal.cancelButton}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending || details.trim().length < 10}
                                        className="auth-button"
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
