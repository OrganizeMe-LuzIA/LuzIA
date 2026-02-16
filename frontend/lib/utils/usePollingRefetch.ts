"use client";

import { useEffect } from "react";

interface UsePollingRefetchOptions {
  intervalMs?: number;
  enabled?: boolean;
  pauseWhenHidden?: boolean;
}

export function usePollingRefetch(
  refetch: () => Promise<void>,
  options: UsePollingRefetchOptions = {},
): void {
  const {
    intervalMs = 30_000,
    enabled = true,
    pauseWhenHidden = true,
  } = options;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      if (pauseWhenHidden && document.visibilityState !== "visible") {
        return;
      }

      void refetch();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs, pauseWhenHidden, refetch]);
}
