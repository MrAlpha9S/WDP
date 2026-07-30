import { useState, useEffect } from "react";
import { Wallet, CheckCircle2, Loader2, Clock } from "lucide-react";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";
import { Pagination } from "./Pagination";
import { useSocket } from "../providers/SocketProvider";
import type { PaymentEntity, PaymentStatus, PaymentsResponse } from "../api/paymentTypes";
import { ErrorState } from "./ErrorState";

// Statistical payment-verification list, reused by Admin (payer for
// race_prize/referee_fee) and Referee (payee for referee_fee) dashboards.
// Real money changes hands outside the system — this only records whether
// both sides have confirmed it happened.

export const PAYMENT_TYPE_LABEL: Record<string, string> = {
    race_prize: "Race Prize",
    referee_fee: "Referee Fee",
    jockey_payout: "Jockey Payout",
};

function StatusBadge({ status }: { status: PaymentStatus }) {
    const map: Record<PaymentStatus, string> = {
        unpaid: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${map[status]}`}>
            {status}
        </span>
    );
}

interface PaymentsPanelProps {
    title: string;
    /** Role-bound service call, e.g. `(page, limit, sortBy, order) => adminService.getPayments(page, limit, undefined, 'payer', sortBy, order)`. */
    fetchPayments: (page: number, limit: number, sortBy: string, order: "asc" | "desc") => Promise<PaymentsResponse>;
    /** Role-bound confirm call, e.g. `adminService.confirmPaymentPaid`. */
    onConfirm: (paymentId: string) => Promise<{ code: number; data?: PaymentEntity; msg: string }>;
    /** Which side of the payment the current role sits on, to know when it's "my turn" to act. */
    myRoleSide: "payer" | "payee";
    confirmLabel: string;
    /** Unique key for this panel's pagination cache — bump when the underlying query params change. */
    cacheKey: string;
    /**
     * Logged-in user's own id — when provided, the confirm button only renders on rows
     * where this user is actually the payer/payee (e.g. an admin viewing a system-wide
     * list that includes other admins' or other roles' payments). Omit for panels that
     * are already server-side scoped to the caller's own rows (e.g. referee's payments).
     */
    currentUserId?: string;
    /** Called after a confirm fully settles the payment (both sides confirmed) — the point where a wallet balance actually changes. */
    onSettled?: () => void;
}

const SORT_OPTIONS: { value: string; label: string; sortBy: string; order: "asc" | "desc" }[] = [
    { value: "createdAt:desc", label: "Newest First", sortBy: "createdAt", order: "desc" },
    { value: "createdAt:asc", label: "Oldest First", sortBy: "createdAt", order: "asc" },
    { value: "amount:desc", label: "Amount High–Low", sortBy: "amount", order: "desc" },
    { value: "amount:asc", label: "Amount Low–High", sortBy: "amount", order: "asc" },
];

export default function PaymentsPanel({ title, fetchPayments, onConfirm, myRoleSide, confirmLabel, cacheKey, currentUserId, onSettled }: PaymentsPanelProps) {
    const [sortValue, setSortValue] = useState("createdAt:desc");
    const [limit, setLimit] = useState(10);
    const sortOption = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];

    const { data, loading, error, pagination, page, setPage, mutate, refresh } = usePaginatedFetch<PaymentEntity>(
        (p) => fetchPayments(p, limit, sortOption.sortBy, sortOption.order).then((res) => res.data),
        `${cacheKey}:${sortValue}:${limit}`,
    );
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Live refetch when a payment-related notification arrives for this user,
    // or when any Transaction document changes (a true broadcast — catches
    // settlements even if a call site forgot to notify this specific user).
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

    const handleConfirm = async (paymentId: string) => {
        setConfirmingId(paymentId);
        setActionError(null);
        try {
            const res = await onConfirm(paymentId);
            if (res.code === 200 && res.data) {
                const updated = res.data;
                mutate((prev) => prev.map((p) => (p._id === paymentId ? updated : p)));
                if (updated.paymentStatus === "paid") onSettled?.();
            }
        } catch (err: any) {
            setActionError(err?.msg || "Failed to confirm payment");
        } finally {
            setConfirmingId(null);
        }
    };

    return (
        <div className="rounded-xl border border-white/[0.07] bg-surface p-5">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <Wallet size={15} className="text-red-500" />
                    {title}
                </h2>
                <select
                    value={sortValue}
                    onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                    className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="w-[110px] shrink-0 bg-surface border border-border rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    {[5, 10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n} rows</option>
                    ))}
                </select>
            </div>

            {actionError && (
                <p className="text-[12px] text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                    {actionError}
                </p>
            )}

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading payments...</p>
            ) : error ? (
                <ErrorState
                    message={(error as any)?.msg ?? "Failed to load payments."}
                    onRetry={refresh}
                />
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No payments to review.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((payment) => {
                        const myConfirmed = myRoleSide === "payer" ? payment.payerConfirmed : payment.payeeConfirmed;
                        const otherConfirmed = myRoleSide === "payer" ? payment.payeeConfirmed : payment.payerConfirmed;
                        const canConfirm = currentUserId
                            ? (myRoleSide === "payer" ? payment.payerId : payment.payeeId) === currentUserId
                            : true;
                        const counterpartyName = myRoleSide === "payer"
                            ? payment.payeeName ?? `Unknown ${payment.payeeRole}`
                            : payment.payerName ?? `Unknown ${payment.payerRole}`;
                        const counterpartyLabel = myRoleSide === "payer" ? "To" : "From";
                        return (
                            <div key={payment._id} className="flex items-center justify-between py-3 gap-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-white">
                                        {PAYMENT_TYPE_LABEL[payment.paymentType] ?? payment.paymentType} — {payment.amount.toLocaleString()} ₫
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {counterpartyLabel}: <span className="text-gray-300 font-medium">{counterpartyName}</span>
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {payment.originalCurrency && payment.originalCurrency !== 'VND' && payment.originalAmount != null
                                            ? `${payment.originalAmount.toLocaleString()} ${payment.originalCurrency} · `
                                            : ""}
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                        {otherConfirmed && !myConfirmed ? " · waiting on you" : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={payment.paymentStatus} />
                                    {payment.paymentStatus === "paid" ? (
                                        <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Settled
                                        </span>
                                    ) : myConfirmed || !canConfirm ? (
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> {myConfirmed ? "Waiting" : "Not yours to confirm"}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleConfirm(payment._id)}
                                            disabled={confirmingId === payment._id}
                                            className="flex items-center gap-1.5 text-[12px] font-medium text-white bg-red-700 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            {confirmingId === payment._id ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={13} />
                                            )}
                                            {confirmLabel}
                                        </button>
                                    )}
                                </div>
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
