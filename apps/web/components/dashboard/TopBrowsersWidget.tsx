"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@pingtome/ui";
import { Chrome, Globe } from "lucide-react";
import * as React from "react";

interface TopBrowsersWidgetProps {
  browsers: Record<string, number>; // e.g., { Chrome: 150, Safari: 80, Firefox: 30 }
  loading?: boolean;
}

// Browser icon mapping
const getBrowserIcon = (browserName: string) => {
  const name = browserName.toLowerCase();
  if (name.includes("chrome")) {
    return <Chrome className="h-4 w-4 text-[#4285F4]" />;
  }
  if (name.includes("safari")) {
    return <Globe className="h-4 w-4 text-[#5AC8FA]" />;
  }
  if (name.includes("firefox")) {
    return <Globe className="h-4 w-4 text-[#FF7139]" />;
  }
  if (name.includes("edge")) {
    return <Globe className="h-4 w-4 text-[#0078D7]" />;
  }
  return <Globe className="h-4 w-4 text-muted-foreground" />;
};

// Browser color mapping for progress bars
const getBrowserColor = (browserName: string) => {
  const name = browserName.toLowerCase();
  if (name.includes("chrome")) return "#4285F4";
  if (name.includes("safari")) return "#5AC8FA";
  if (name.includes("firefox")) return "#FF7139";
  if (name.includes("edge")) return "#0078D7";
  if (name.includes("opera")) return "#FF1B2D";
  return "#8B5CF6"; // Default purple for unknown browsers
};

export function TopBrowsersWidget({
  browsers,
  loading = false,
}: TopBrowsersWidgetProps) {
  // Calculate total clicks
  const totalClicks = React.useMemo(() => {
    return Object.values(browsers).reduce((sum, count) => sum + count, 0);
  }, [browsers]);

  // Get top 3 browsers sorted by count
  const topBrowsers = React.useMemo(() => {
    return Object.entries(browsers)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalClicks > 0 ? (count / totalClicks) * 100 : 0,
      }));
  }, [browsers, totalClicks]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Top Browsers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (totalClicks === 0 || topBrowsers.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Top Browsers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No browser data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Top Browsers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topBrowsers.map((browser, index) => (
          <div key={browser.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getBrowserIcon(browser.name)}
                <span className="text-sm font-medium">{browser.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {browser.percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                  {browser.count.toLocaleString()}{" "}
                  {browser.count === 1 ? "click" : "clicks"}
                </span>
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full transition-all"
                style={{
                  width: `${browser.percentage}%`,
                  backgroundColor: getBrowserColor(browser.name),
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
