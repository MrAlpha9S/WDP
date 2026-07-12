import { useState } from "react";
import { Wallet } from "lucide-react";
import { adminService } from "../../api/adminService";
import PaymentsPanel from "../../components/PaymentsPanel";
import { Pagination } from "../../components/Pagination";
import { usePaginatedFetch } from "../../hooks/usePaginatedFetch";
import type { PaymentStatus, LedgerEntry } from "../../api/paymentTypes";

const LIMIT = 20;

// Read-only wallet-ledger view — house-take deposits are auto-applied (no
// confirmation step), so this is simpler than PaymentsPanel: no confirm action.
function LedgerPanel() {
    const [sortValue, setSortValue] = useState<"createdAt:desc" | "createdAt:asc" | "amount:desc" | "amount:asc">("createdAt:desc");
    const [sortBy, order] = sortValue.split(":") as [string, "asc" | "desc"];

    const { data, loading, error, pagination, page, setPage } = usePaginatedFetch<LedgerEntry>(
        (p) => adminService.getLedger(p, LIMIT, sortBy, order).then((res) => res.data),
        `admin-ledger-${sortValue}`,
    );

    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <Wallet size={15} className="text-red-500" />
                    House Earnings
                </h2>
                <select
                    value={sortValue}
                    onChange={(e) => { setSortValue(e.target.value as typeof sortValue); setPage(1); }}
                    className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    <option value="createdAt:desc">Newest First</option>
                    <option value="createdAt:asc">Oldest First</option>
                    <option value="amount:desc">Amount High–Low</option>
                    <option value="amount:asc">Amount Low–High</option>
                </select>
            </div>

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading earnings...</p>
            ) : error ? (
                <p className="text-[13px] text-red-400 text-center py-6">Failed to load earnings.</p>
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No earnings yet.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between py-3 gap-3">
                            <div>
                                <p className="text-[13px] font-semibold text-white">
                                    {entry.description ?? "Wallet activity"}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="text-[13px] font-bold text-emerald-400">
                                +{entry.amount.toLocaleString()} ₫
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
            />
        </div>
    );
}

export default function AdminPaymentsPage() {
    const [status, setStatus] = useState<PaymentStatus | "All">("All");

    return (
        <div className="px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Payments
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        All race prize and referee fee payments owed by admin (statistical wallet tracking only).
                    </p>
                </div>

                <select
                    value={status}
                    onChange={e => setStatus(e.target.value as PaymentStatus | "All")}
                    className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                >
                    <option value="All">All Statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="processing">Processing</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            <div className="flex flex-col gap-4">
                <PaymentsPanel
                    title="All Payments"
                    fetchPayments={(page, sortBy, order) => adminService.getPayments(page, LIMIT, status !== "All" ? status : undefined, "payer", sortBy, order)}
                    onConfirm={adminService.confirmPaymentPaid}
                    myRoleSide="payer"
                    confirmLabel="Confirm Paid"
                    cacheKey={`admin-payments-all-${status}`}
                />

                <LedgerPanel />
            </div>
        </div>
    );
}
