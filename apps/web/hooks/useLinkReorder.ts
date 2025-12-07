"use client";

import { useState, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/api";

interface LinkOrdering {
  id: string;
  order: number;
}

interface UseLinkReorderOptions {
  bioPageId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseLinkReorderReturn {
  reorderLinks: (orderings: LinkOrdering[]) => Promise<void>;
  isReordering: boolean;
}

/**
 * Hook for managing bio page link reordering with optimistic updates
 * Includes debouncing to prevent rapid API calls
 */
export function useLinkReorder({
  bioPageId,
  onSuccess,
  onError,
}: UseLinkReorderOptions): UseLinkReorderReturn {
  const [isReordering, setIsReordering] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingOrderingsRef = useRef<LinkOrdering[] | null>(null);

  const executeReorder = useCallback(
    async (orderings: LinkOrdering[]) => {
      setIsReordering(true);
      try {
        await apiRequest(`/biopages/${bioPageId}/links/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ orderings }),
        });
        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to reorder links");
        console.error("Failed to save link order:", error);
        onError?.(err);
        throw err;
      } finally {
        setIsReordering(false);
      }
    },
    [bioPageId, onSuccess, onError]
  );

  const reorderLinks = useCallback(
    async (orderings: LinkOrdering[]) => {
      // Store the latest orderings
      pendingOrderingsRef.current = orderings;

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set up debounced API call (300ms delay)
      return new Promise<void>((resolve, reject) => {
        debounceTimerRef.current = setTimeout(async () => {
          const orderingsToSend = pendingOrderingsRef.current;
          pendingOrderingsRef.current = null;

          if (orderingsToSend) {
            try {
              await executeReorder(orderingsToSend);
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            resolve();
          }
        }, 300);
      });
    },
    [executeReorder]
  );

  return {
    reorderLinks,
    isReordering,
  };
}
