"use client";

import { DependencyList, useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    hasDataRef.current = data !== null;
  }, [data]);

  const refetch = useCallback(async () => {
    const shouldKeepContent = hasDataRef.current;
    setLoading(!shouldKeepContent);
    setRefreshing(shouldKeepContent);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha inesperada na requisição.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, refreshing, error, refetch };
}
