import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import type { SortOrder } from "../../hooks/useSortableColumns";

interface SortableThProps {
    field: string;
    activeField: string;
    order: SortOrder;
    onSort: (field: string) => void;
    children: ReactNode;
    className?: string;
}

// Pairs with useSortableColumns. Fixes the a11y gap the design audit flagged:
// the duplicated inline `<th onClick=...>` in AdminUsersPage/ViolationManagementPage
// wasn't keyboard-reachable and had no aria-sort. This is a real <button> inside
// the header cell plus aria-sort on the <th> itself.
export default function SortableTh({ field, activeField, order, onSort, children, className }: SortableThProps) {
    const isActive = activeField === field;
    const ariaSort = isActive ? (order === "asc" ? "ascending" : "descending") : "none";

    return (
        <th
            aria-sort={ariaSort}
            className={`p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase whitespace-nowrap ${className ?? ""}`}
        >
            <button
                type="button"
                onClick={() => onSort(field)}
                className="flex items-center gap-1 hover:text-text transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
            >
                {children}
                {!isActive && <ArrowUpDown size={11} className="text-text-muted/70" />}
                {isActive && order === "asc" && <ArrowUp size={11} className="text-gold" />}
                {isActive && order === "desc" && <ArrowDown size={11} className="text-gold" />}
            </button>
        </th>
    );
}
