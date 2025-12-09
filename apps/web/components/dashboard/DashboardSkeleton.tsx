"use client";

import { Card, CardContent, CardHeader } from "@pingtome/ui";
import { Skeleton } from "@pingtome/ui";

/**
 * Skeleton for individual stats card with gradient background
 * Matches the h-[144px] height of actual stats cards
 */
export function StatsCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl h-[144px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24 bg-white/30" />
            <Skeleton className="h-10 w-20 bg-white/40" />
            <Skeleton className="h-3 w-32 bg-white/30" />
          </div>
          <Skeleton className="h-14 w-14 rounded-2xl bg-white/30" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for the grid of 4 stats cards
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

/**
 * Skeleton for individual quick action card
 * Matches the standard card height from dashboard
 */
export function QuickActionCardSkeleton() {
  return (
    <Card className="h-full border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for the grid of 3 quick action cards
 */
export function QuickActionsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <QuickActionCardSkeleton />
      <QuickActionCardSkeleton />
      <QuickActionCardSkeleton />
    </div>
  );
}

/**
 * Skeleton for the engagements chart
 * Matches the h-[300px] height of actual chart
 */
export function ChartSkeleton() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart legend area */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Chart visualization area */}
          <div className="h-[300px] flex items-end justify-between gap-2 px-4">
            {/* Bar chart skeleton with varying heights */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <Skeleton
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.random() * 200 + 50}px`,
                    opacity: 0.3 + Math.random() * 0.4
                  }}
                />
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between px-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for a single link table row
 * Matches the h-12 height of actual table rows
 */
export function LinkRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 h-12">
      {/* Checkbox */}
      <Skeleton className="h-4 w-4 rounded" />

      {/* Favicon */}
      <Skeleton className="h-8 w-8 rounded" />

      {/* Link info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Actions */}
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Skeleton for the links table with 5 rows
 * @param rows - Number of skeleton rows to display (default: 5)
 */
export function LinksTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <LinkRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for the recent links card section
 */
export function RecentLinksCardSkeleton() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </CardHeader>
      <CardContent className="pt-4">
        <LinksTableSkeleton rows={5} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for live activity feed
 */
export function LiveActivitySkeleton() {
  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Complete dashboard skeleton layout
 * Includes all sections: stats, quick actions, chart, and recent links
 */
export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCardsSkeleton />

      {/* Quick Actions */}
      <QuickActionsSkeleton />

      {/* Analytics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <ChartSkeleton />
        </div>
        <div className="md:col-span-1">
          <LiveActivitySkeleton />
        </div>
      </div>

      {/* Recent Links */}
      <RecentLinksCardSkeleton />
    </div>
  );
}
