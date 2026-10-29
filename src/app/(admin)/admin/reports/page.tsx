import type { Metadata } from "next";
import { requireAdmin } from "@/server/queries/session";
import { getAdminReports } from "@/server/queries/reports";
import { reportContent } from "@/lib/content/reports";
import { AdminReportCard } from "@/components/admin/admin-report-card";

export const metadata: Metadata = {
    title: "Coda Segnalazioni Moderazione | Admin | Tailor",
};

export const instant = false;

export default async function AdminReportsPage() {
    await requireAdmin("/admin/reports");
    const reports = await getAdminReports();
    const { admin } = reportContent;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                    {admin.title}
                </h1>
                <p className="mt-2 text-sm text-neutral-600 sm:text-base">
                    {admin.subtitle}
                </p>
            </header>

            {reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-600">
                    {admin.empty}
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <AdminReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
}
