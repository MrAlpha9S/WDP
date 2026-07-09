import { useState } from "react";
import { Wallet, CheckCircle2, Loader2, Clock } from "lucide-react";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";
import { Pagination } from "./Pagination";
import type { PaymentEntity, PaymentStatus, PaymentsResponse } from "../api/paymentTypes";

// Statistical payment-verification list, reused by Admin (payer for
// race_prize/referee_fee) and Referee (payee for referee_fee) dashboards.
// Real money changes hands outside the system — this only records whether
// both sides have confirmed it happened.

const PAYMENT_TYPE_LABEL: Record<string, string> = {
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
    /** Role-bound service call, e.g. `(page) => adminService.getPayments(page, 10, undefined, 'payer')`. */
    fetchPayments: (page: number) => Promise<PaymentsResponse>;
    /** Role-bound confirm call, e.g. `adminService.confirmPaymentPaid`. */
    onConfirm: (paymentId: string) => Promise<{ code: number; data?: PaymentEntity; msg: string }>;
    /** Which side of the payment the current role sits on, to know when it's "my turn" to act. */
    myRoleSide: "payer" | "payee";
    confirmLabel: string;
    /** Unique key for this panel's pagination cache — bump when the underlying query params change. */
    cacheKey: string;
}

export default function PaymentsPanel({ title, fetchPayments, onConfirm, myRoleSide, confirmLabel, cacheKey }: PaymentsPanelProps) {
    const { data, loading, error, pagination, page, setPage, mutate } = usePaginatedFetch<PaymentEntity>(
        (p) => fetchPayments(p).then((res) => res.data),
        cacheKey,
    );
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleConfirm = async (paymentId: string) => {
        setConfirmingId(paymentId);
        setActionError(null);
        try {
            const res = await onConfirm(paymentId);
            if (res.code === 200 && res.data) {
                const updated = res.data;
                mutate((prev) => prev.map((p) => (p._id === paymentId ? updated : p)));
            }
        } catch (err: any) {
            setActionError(err?.msg || "Failed to confirm payment");
        } finally {
            setConfirmingId(null);
        }
    };

    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <Wallet size={15} className="text-red-500" />
                    {title}
                </h2>
            </div>

            {actionError && (
                <p className="text-[12px] text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                    {actionError}
                </p>
            )}

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading payments...</p>
            ) : error ? (
                <p className="text-[13px] text-red-400 text-center py-6">Failed to load payments.</p>
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No payments to review.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((payment) => {
                        const myConfirmed = myRoleSide === "payer" ? payment.payerConfirmed : payment.payeeConfirmed;
                        const otherConfirmed = myRoleSide === "payer" ? payment.payeeConfirmed : payment.payerConfirmed;
                        return (
                            <div key={payment._id} className="flex items-center justify-between py-3 gap-3">
                                <div>
                                    <p className="text-[13px] font-semibold text-white">
                                        {PAYMENT_TYPE_LABEL[payment.paymentType] ?? payment.paymentType} — {payment.amount.toLocaleString()} ₫
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
                                    {myConfirmed ? (
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> Waiting
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
