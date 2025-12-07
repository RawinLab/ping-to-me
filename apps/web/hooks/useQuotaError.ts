"use client";

import { useState, useCallback } from "react";

interface QuotaError {
  code: string;
  message: string;
  currentUsage: number;
  limit: number;
  upgradeUrl?: string;
}

interface QuotaErrorState {
  isQuotaError: boolean;
  quotaData: QuotaError | null;
  resourceType: string;
}

export function useQuotaError() {
  const [quotaState, setQuotaState] = useState<QuotaErrorState>({
    isQuotaError: false,
    quotaData: null,
    resourceType: "",
  });

  const handleError = useCallback((error: any, resourceType: string = "links") => {
    // Check if this is a quota exceeded error
    if (error?.response?.data?.code === "QUOTA_EXCEEDED" ||
        error?.code === "QUOTA_EXCEEDED") {
      const data = error?.response?.data || error;
      setQuotaState({
        isQuotaError: true,
        quotaData: {
          code: data.code,
          message: data.message,
          currentUsage: data.currentUsage,
          limit: data.limit,
          upgradeUrl: data.upgradeUrl,
        },
        resourceType,
      });
      return true;
    }
    return false;
  }, []);

  const clearError = useCallback(() => {
    setQuotaState({
      isQuotaError: false,
      quotaData: null,
      resourceType: "",
    });
  }, []);

  return {
    ...quotaState,
    handleError,
    clearError,
  };
}
