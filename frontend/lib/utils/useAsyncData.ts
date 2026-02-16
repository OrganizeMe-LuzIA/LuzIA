"use client";

import { DependencyList, useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAsyncDataOptions {
  keepPreviousData?: boolean;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function useAsyncData<T>(
  loader: (signal?: AbortSignal) => Promise<T>,
  deps: DependencyList,
  options: UseAsyncDataOptions = {},
): AsyncState<T> {
  const { keepPreviousData = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    hasDataRef.current = data !== null;
  }, [data]);

  const refetch = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const shouldKeepContent = keepPreviousData && hasDataRef.current;
    setLoading(!shouldKeepContent);
    setRefreshing(shouldKeepContent);
    setError(null);

    try {
      const result = await loader(controller.signal);

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        currentRequestId !== requestIdRef.current
      ) {
        return;
      }

      setData(result);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        return;
      }

      if (!mountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : "Falha inesperada na requisição.";
      setError(message);
    } finally {
      if (!mountedRef.current || currentRequestId !== requestIdRef.current) {
        return;
      }

      setLoading(false);
      setRefreshing(false);
    }
  }, [keepPreviousData, ...deps]);

  useEffect(() => {
    void refetch();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refetch]);

  return { data, loading, refreshing, error, refetch };
}
