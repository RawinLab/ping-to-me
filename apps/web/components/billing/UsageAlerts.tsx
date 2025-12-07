"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Button } from "@pingtome/ui";
import { X, AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface UsageAlert {
  resource: string;
  label: string;
  used: number;
  limit: number;
  percentUsed: number;
  level: "warning" | "critical";
}

interface UsageAlertsProps {
  organizationId: string;
  className?: string;
}

const resourceLabels: Record<string, string> = {
  links: "Monthly links",
  domains: "Custom domains",
  members: "Team members",
  apiCalls: "API calls",
};

export function UsageAlerts({ organizationId, className }: UsageAlertsProps) {
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUsage() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/usage/limits`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        const newAlerts: UsageAlert[] = [];

        // Check each resource
        const resources = ["links", "domains", "members", "apiCalls"] as const;
        for (const resource of resources) {
          const comparison = data.comparisons[resource];
          if (comparison && !comparison.unlimited) {
            if (comparison.percentUsed >= 100) {
              newAlerts.push({
                resource,
                label: resourceLabels[resource] || resource,
                used: comparison.used,
                limit: comparison.limit,
                percentUsed: comparison.percentUsed,
                level: "critical",
              });
            } else if (comparison.percentUsed >= 80) {
              newAlerts.push({
                resource,
                label: resourceLabels[resource] || resource,
                used: comparison.used,
                limit: comparison.limit,
                percentUsed: comparison.percentUsed,
                level: "warning",
              });
            }
          }
        }

        setAlerts(newAlerts);
      } catch {
        // Silently fail - alerts are not critical
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      checkUsage();
    }
  }, [organizationId]);

  const dismissAlert = (resource: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(resource);
    setDismissed(newDismissed);

    // Store in sessionStorage to persist across page navigations
    try {
      sessionStorage.setItem(
        "dismissedUsageAlerts",
        JSON.stringify(Array.from(newDismissed))
      );
    } catch {}
  };

  // Load dismissed alerts from storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("dismissedUsageAlerts");
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.resource));

  if (loading || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {visibleAlerts.map((alert) => (
        <Alert
          key={alert.resource}
          variant={alert.level === "critical" ? "destructive" : "default"}
          className={
            alert.level === "warning"
              ? "border-yellow-500 bg-yellow-50 text-yellow-900"
              : ""
          }
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {alert.level === "critical" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <AlertTitle className="mb-1">
                  {alert.level === "critical"
                    ? `${alert.label} limit reached`
                    : `${alert.label} almost full`}
                </AlertTitle>
                <AlertDescription className="flex items-center gap-4">
                  <span>
                    {alert.used} / {alert.limit} used ({alert.percentUsed}%)
                  </span>
                  <Button
                    asChild
                    size="sm"
                    variant={alert.level === "critical" ? "default" : "outline"}
                  >
                    <Link href="/pricing">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Upgrade
                    </Link>
                  </Button>
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2"
              onClick={() => dismissAlert(alert.resource)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
