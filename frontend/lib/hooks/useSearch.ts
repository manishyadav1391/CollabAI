"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { SearchResult } from "@/lib/types";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 250;

export function useSearch(workspaceId: string) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      apiClient
        .get<{ results: SearchResult[]; has_more: boolean }>("/search", {
          params: { q: trimmed, workspace_id: workspaceId, limit: PAGE_SIZE, offset: 0 },
        })
        .then(({ data }) => {
          if (id !== requestId.current) return; // a newer query superseded this one
          setResults(data.results);
          setHasMore(data.has_more);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setResults([]);
          setHasMore(false);
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  function loadMore() {
    const trimmed = query.trim();
    if (!trimmed || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const id = requestId.current;
    apiClient
      .get<{ results: SearchResult[]; has_more: boolean }>("/search", {
        params: { q: trimmed, workspace_id: workspaceId, limit: PAGE_SIZE, offset: results.length },
      })
      .then(({ data }) => {
        if (id !== requestId.current) return;
        setResults((prev) => [...prev, ...data.results]);
        setHasMore(data.has_more);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  function reset() {
    setQuery("");
    setResults([]);
    setHasMore(false);
  }

  return { query, setQuery, results, loading, hasMore, loadingMore, loadMore, reset };
}
