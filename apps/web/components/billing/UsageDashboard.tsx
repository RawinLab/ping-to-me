"use client";

import { useEffect, useState } from "react";
import { Progress, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, Button } from "@pingtome/ui";
import { AlertCircle, TrendingUp, Link2, Globe, Users, Zap } from "lucide-react";
import Link from "next/link";

interface UsageItem {
  used: number;
  limit: number;
  unlimited: boolean;
  percentUsed: number;
}

interface UsageData {
  plan: string;
  limits: {
    linksPerMonth: number;
    customDomains: number;
    teamMembers: number;
    apiCallsPerMonth: number;
    analyticsRetentionDays: number;
  };
  usage: {
    links: number;
    domains: number;
    members: number;
    apiCalls: number;
  };
  comparisons: {
    links: UsageItem;
    domains: UsageItem;
    members: UsageItem;
    apiCalls: UsageItem;
  };
}

interface UsageDashboardProps {
  organizationId: string;
}

const resourceConfig = {
  links: { label: "Links this month", icon: Link2, color: "blue" },
  domains: { label: "Custom domains", icon: Globe, color: "purple" },
  members: { label: "Team members", icon: Users, color: "green" },
  apiCalls: { label: "API calls", icon: Zap, color: "orange" },
};

function getProgressColor(percentUsed: number): string {
  if (percentUsed >= 100) return "bg-red-500";
  if (percentUsed >= 80) return "bg-yellow-500";
  return "bg-blue-500";
}

function UsageItemCard({
  resource,
  data,
}: {
  resource: keyof typeof resourceConfig;
  data: UsageItem;
}) {
  const config = resourceConfig[resource];
  const Icon = config.icon;

  if (data.unlimited) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{config.label}</p>
            <p className="text-2xl font-bold">{data.used}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Unlimited
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium">{config.label}</p>
        </div>
        {data.percentUsed >= 100 && (
          <Badge variant="destructive">Limit reached</Badge>
        )}
        {data.percentUsed >= 80 && data.percentUsed < 100 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            Almost full
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {data.used} / {data.limit} used
          </span>
          <span className="text-muted-foreground">{data.percentUsed}%</span>
        </div>
        <Progress
          value={Math.min(data.percentUsed, 100)}
          className="h-2"
        />
      </div>
    </div>
  );
}

export function UsageDashboard({ organizationId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/usage/limits`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch usage data");
        }

        const data = await response.json();
        setUsage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage");
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchUsage();
    }
  }, [organizationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const hasLimitReached = Object.values(usage.comparisons).some(
    (c) => !c.unlimited && c.percentUsed >= 100
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Usage</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Current plan: <span className="font-medium capitalize">{usage.plan}</span>
          </p>
        </div>
        {hasLimitReached && (
          <Button asChild size="sm">
            <Link href="/pricing">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <UsageItemCard resource="links" data={usage.comparisons.links} />
        <UsageItemCard resource="domains" data={usage.comparisons.domains} />
        <UsageItemCard resource="members" data={usage.comparisons.members} />
        <UsageItemCard resource="apiCalls" data={usage.comparisons.apiCalls} />
      </CardContent>
    </Card>
  );
}
