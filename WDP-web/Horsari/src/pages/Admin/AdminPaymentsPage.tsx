import { useState, useEffect } from "react";
import { adminService } from "../../api/adminService";
import PaymentsPanel, { PAYMENT_TYPE_LABEL } from "../../components/PaymentsPanel";
import { Pagination } from "../../components/Pagination";
import { usePaginatedFetch } from "../../hooks/usePaginatedFetch";
import { useAuth } from "../../providers/AuthProvider";
import { useSocket } from "../../providers/SocketProvider";
import { ErrorState } from "../../components/ErrorState";
import type { PaymentStatus, PaymentType, LedgerEntry } from "../../api/paymentTypes";

const ROLE_LABEL: Record<string, string> = {
    admin: "Admin (House)",
    spectator: "Spectator",
    horseowner: "Horse Owner",
    jockey: "Jockey",
    referee: "Referee",
};

// Read-only, system-wide wallet-ledger view — every reward/deposit/withdrawal/
// refund row for any user (spectator prediction payouts, admin house-take,
// etc.), auto-applied with no confirmation step, so this is simpler than
// PaymentsPanel: no confirm action.
function LedgerPanel() {
    const [sortValue, setSortValue] = useState<"createdAt:desc" | "createdAt:asc" | "amount:desc" | "amount:asc">("createdAt:desc");
    const [sortBy, order] = sortValue.split(":") as [string, "asc" | "desc"];
    const [limit, setLimit] = useState(20);

    const { data, loading, error, pagination, page, setPage, refresh } = usePaginatedFetch<LedgerEntry>(
        (p) => adminService.getAllLedger(p, limit, sortBy, order).then((res) => res.data),
        `admin-ledger-all-${sortValue}-${limit}`,
    );

    // Live refetch when a payment-related notification arrives, or when any
    // Transaction document changes (a true broadcast, unlike the targeted
    // notification below — catches every settlement even if a call site
    // forgot to notify this specific admin).
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handler = (payload: { type?: string }) => {
            if (payload?.type?.startsWith("payment_")) refresh();
        };
        socket.on("notification_created", handler);
        socket.on("transaction_updated", refresh);
        return () => {
            socket.off("notification_created", handler);
            socket.off("transaction_updated", refresh);
        };
    }, [socket, refresh]);

    return (
        <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-end mb-5 gap-3 flex-wrap">
                <select
                    value={sortValue}
                    onChange={(e) => { setSortValue(e.target.value as typeof sortValue); setPage(1); }}
                    className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    <option value="createdAt:desc">Newest First</option>
                    <option value="createdAt:asc">Oldest First</option>
                    <option value="amount:desc">Amount High–Low</option>
                    <option value="amount:asc">Amount Low–High</option>
                </select>
                <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="w-[110px] shrink-0 bg-surface border border-border rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    {[5, 10, 20, 50, 100].map(n => (
                        <option key={n} value={n}>{n} rows</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading wallet activity...</p>
            ) : error ? (
                <ErrorState
                    message={(error as any)?.msg ?? "Failed to load wallet activity."}
                    onRetry={refresh}
                />
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No wallet activity yet.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((entry) => {
                        // transactionType alone doesn't tell credit vs. debit — e.g. "reward"
                        // covers both prediction payouts (positive) and stake deductions
                        // (negative amount). The amount's own sign is the source of truth.
                        const isCredit = entry.amount >= 0;
                        return (
                            <div key={entry._id} className="flex items-center justify-between py-3 gap-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-white">
                                        {entry.description ?? "Wallet activity"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {entry.userName ?? "Unknown user"}
                                        {entry.userRole && ` · ${ROLE_LABEL[entry.userRole] ?? entry.userRole}`}
                                        {" · "}{new Date(entry.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`text-[13px] font-bold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                                    {isCredit ? "+" : "-"}{Math.abs(entry.amount).toLocaleString()} ₫
                                </span>
                            </div>
                        );
                    })}
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
    const [paymentType, setPaymentType] = useState<PaymentType | "All">("All");
    const [activeTab, setActiveTab] = useState<"Payments" | "Earnings">("Payments");
    const { user } = useAuth();

    return (
        <div className="flex flex-col h-full px-8 py-8 overflow-hidden font-sans">
            <div className="mb-5 flex items-start justify-between gap-4 flex-wrap shrink-0">
                <div>
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight font-serif"
                    >
                        Payments
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Every race prize, referee fee, and jockey payout in the system (statistical wallet tracking only).
                    </p>
                </div>

                {activeTab === "Payments" && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <select
                            value={paymentType}
                            onChange={e => setPaymentType(e.target.value as PaymentType | "All")}
                            className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            {Object.entries(PAYMENT_TYPE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as PaymentStatus | "All")}
                            className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="processing">Processing</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border mb-5 shrink-0 gap-8">
                <button
                    className={`pb-2 text-[13px] font-semibold transition-colors ${activeTab === "Payments" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                    onClick={() => setActiveTab("Payments")}
                >
                    All Payments
                </button>
                <button
                    className={`pb-2 text-[13px] font-semibold transition-colors ${activeTab === "Earnings" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                    onClick={() => setActiveTab("Earnings")}
                >
                    Wallet Activity
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {activeTab === "Payments" ? (
                    <PaymentsPanel
                        title="All Payments"
                        fetchPayments={(page, limit, sortBy, order) => adminService.getAllPayments(page, limit, status !== "All" ? status : undefined, paymentType !== "All" ? paymentType : undefined, sortBy, order)}
                        onConfirm={adminService.confirmPaymentPaid}
                        myRoleSide="payer"
                        currentUserId={user?.id}
                        confirmLabel="Confirm Paid"
                        cacheKey={`admin-payments-all-${status}-${paymentType}`}
                    />
                ) : (
                    <LedgerPanel />
                )}
            </div>
        </div>
    );
}
