import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

function getPageRange(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

interface PaginationProps {
    page: number;
    totalPages: number;
    totalItems?: number;
    limit?: number;
    onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, totalItems, limit, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPageRange(page, totalPages);
    const from = totalItems != null && limit ? (page - 1) * limit + 1 : null;
    const to = totalItems != null && limit ? Math.min(page * limit, totalItems) : null;

    const btnBase =
        "h-[30px] min-w-[30px] px-1.5 rounded border text-[12px] font-medium transition-colors flex items-center justify-center";
    const btnDefault =
        "bg-surface border-border text-gray-400 hover:text-white hover:bg-[#252525]";
    const btnActive = "bg-[#ab3030] border-red-700/40 text-white";
    const btnDisabled = "opacity-40 cursor-not-allowed pointer-events-none";

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.07]">
            <span className="text-[12px] text-gray-500">
                {from != null && to != null
                    ? `Showing ${from}–${to} of ${totalItems}`
                    : `Page ${page} of ${totalPages}`}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page === 1}
                    className={`${btnBase} ${btnDefault} ${page === 1 ? btnDisabled : ""}`}
                    title="First page"
                >
                    <ChevronsLeft size={13} />
                </button>
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className={`${btnBase} ${btnDefault} ${page === 1 ? btnDisabled : ""}`}
                    title="Previous page"
                >
                    <ChevronLeft size={13} />
                </button>

                {pages.map((p, i) =>
                    p === "..." ? (
                        <span key={`gap-${i}`} className="text-[12px] text-gray-600 px-1">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`${btnBase} ${p === page ? btnActive : btnDefault}`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`${btnBase} ${btnDefault} ${page === totalPages ? btnDisabled : ""}`}
                    title="Next page"
                >
                    <ChevronRight size={13} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages}
                    className={`${btnBase} ${btnDefault} ${page === totalPages ? btnDisabled : ""}`}
                    title="Last page"
                >
                    <ChevronsRight size={13} />
                </button>
            </div>
        </div>
    );
}
