import { useState } from "react";

export type SortOrder = "asc" | "desc";

// Retires the sortBy/order state + handleSort pairing duplicated verbatim
// between AdminUsersPage and ViolationManagementPage. Callers still own
// fetching (sortBy/order feed into their query), this just owns the toggle
// logic and page-reset-on-sort-change convention both pages already had.
export function useSortableColumns(initialField: string, initialOrder: SortOrder = "desc", onSortChange?: () => void) {
    const [sortBy, setSortBy] = useState(initialField);
    const [order, setOrder] = useState<SortOrder>(initialOrder);

    function handleSort(field: string) {
        if (sortBy === field) {
            setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setOrder("asc");
        }
        onSortChange?.();
    }

    return { sortBy, order, setSortBy, setOrder, handleSort };
}
