import { useState, useEffect, useRef, useCallback } from 'react';

export interface PaginationMeta {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
}

export interface UsePaginatedFetchResult<T> {
    data: T[];
    loading: boolean;
    error: unknown;
    pagination: PaginationMeta;
    page: number;
    setPage: (value: number | ((prev: number) => number)) => void;
    /** Re-fetches the current page after clearing the full cache. */
    refresh: () => void;
    /** Optimistically update the cached data for the current page. */
    mutate: (updater: (prev: T[]) => T[]) => void;
}

interface CachedEntry<T> {
    items: T[];
    pagination: PaginationMeta;
}

function normalizePagination(raw: any, fallbackPage: number): PaginationMeta {
    return {
        total: raw?.totalItems ?? raw?.total ?? 0,
        totalPages: raw?.totalPages ?? 1,
        page: raw?.currentPage ?? raw?.page ?? fallbackPage,
        limit: raw?.limit ?? 10,
    };
}

/**
 * Paginated fetch hook with per-page caching and automatic adjacent-page prefetch.
 *
 * - Serves cached pages instantly (no loading flash on back/forward navigation).
 * - After each successful fetch, silently prefetches page-1 and page+1.
 * - When `cacheKey` changes the entire cache is cleared and page resets to 1.
 *   Encode all filter / search / sort params that affect the result set in this key.
 *
 * @param fetcher  Async function receiving the page number; must return `{ items, pagination }`.
 * @param cacheKey Changing this value resets the cache and page. Usually a stringified filter state.
 */
export function usePaginatedFetch<T>(
    fetcher: (page: number) => Promise<{ items: T[]; pagination: any }>,
    cacheKey: string,
): UsePaginatedFetchResult<T> {
    const [page, setPageState] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [data, setData] = useState<T[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 10,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const cache = useRef<Map<number, CachedEntry<T>>>(new Map());
    const inFlight = useRef<Set<number>>(new Set());
    // Always call the latest fetcher without adding it to effect deps
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const prevCacheKeyRef = useRef(cacheKey);

    // Clear cache and reset to page 1 when filters/tabs/search change
    useEffect(() => {
        if (prevCacheKeyRef.current !== cacheKey) {
            prevCacheKeyRef.current = cacheKey;
            cache.current.clear();
            inFlight.current.clear();
            setPageState(1);
        }
    }, [cacheKey]);

    // Background prefetch — no loading state changes
    const prefetch = useCallback((targetPage: number) => {
        if (cache.current.has(targetPage) || inFlight.current.has(targetPage)) return;
        inFlight.current.add(targetPage);
        fetcherRef.current(targetPage)
            .then((res) => {
                cache.current.set(targetPage, {
                    items: res.items,
                    pagination: normalizePagination(res.pagination, targetPage),
                });
            })
            .catch(() => { /* silent — prefetch failures are not user-facing */ })
            .finally(() => { inFlight.current.delete(targetPage); });
    }, []);

    // Primary fetch — instant from cache, otherwise fetches then caches
    useEffect(() => {
        let cancelled = false;
        const cached = cache.current.get(page);

        if (cached) {
            setData(cached.items);
            setPagination(cached.pagination);
            setLoading(false);
            if (page > 1) prefetch(page - 1);
            if (page < cached.pagination.totalPages) prefetch(page + 1);
            return;
        }

        setLoading(true);
        setError(null);
        inFlight.current.add(page);

        fetcherRef.current(page)
            .then((res) => {
                if (cancelled) return;
                const pagi = normalizePagination(res.pagination, page);
                cache.current.set(page, { items: res.items, pagination: pagi });
                inFlight.current.delete(page);
                setData(res.items);
                setPagination(pagi);
                setLoading(false);
                if (page > 1) prefetch(page - 1);
                if (page < pagi.totalPages) prefetch(page + 1);
            })
            .catch((err) => {
                if (cancelled) return;
                inFlight.current.delete(page);
                setError(err);
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [page, cacheKey, refreshKey, prefetch]);

    const setPage = useCallback((value: number | ((prev: number) => number)) => {
        setPageState(value);
    }, []);

    const refresh = useCallback(() => {
        cache.current.clear();
        inFlight.current.clear();
        setRefreshKey((k) => k + 1);
    }, []);

    const mutate = useCallback((updater: (prev: T[]) => T[]) => {
        setData((prev) => {
            const next = updater(prev);
            const cached = cache.current.get(page);
            if (cached) cache.current.set(page, { ...cached, items: next });
            return next;
        });
    }, [page]);

    return { data, loading, error, pagination, page, setPage, refresh, mutate };
}
