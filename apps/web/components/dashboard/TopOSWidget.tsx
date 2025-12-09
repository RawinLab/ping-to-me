"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@pingtome/ui";
import { Monitor, Apple, Laptop, Smartphone } from "lucide-react";

interface TopOSWidgetProps {
  os: Record<string, number>;
  loading?: boolean;
}

const OS_COLORS = {
  Windows: "#0078D7",
  macOS: "#A2AAAD",
  iOS: "#000000",
  Android: "#3DDC84",
  Linux: "#FCC624",
  "Chrome OS": "#4285F4",
  Other: "#8B5CF6",
};

function getOSIcon(osName: string) {
  const lowerName = osName.toLowerCase();

  if (lowerName.includes("windows")) {
    return <Monitor className="h-4 w-4" />;
  }
  if (lowerName.includes("mac") || lowerName.includes("ios")) {
    return <Apple className="h-4 w-4" />;
  }
  if (lowerName.includes("linux")) {
    return <Laptop className="h-4 w-4" />;
  }
  if (lowerName.includes("android")) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

function getOSColor(osName: string): string {
  return OS_COLORS[osName as keyof typeof OS_COLORS] || OS_COLORS.Other;
}

export function TopOSWidget({ os, loading = false }: TopOSWidgetProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Operating Systems
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Calculate total clicks
  const total = Object.values(os).reduce((sum, count) => sum + count, 0);

  // Sort by count descending and take top 3
  const topOS = Object.entries(os)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));

  // If no data, show empty state
  if (topOS.length === 0 || total === 0) {
    return (
      <Card className="overflow-hidden h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Operating Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">
          Operating Systems
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topOS.map((item) => {
          const color = getOSColor(item.name);

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="text-muted-foreground"
                    style={{ color }}
                  >
                    {getOSIcon(item.name)}
                  </div>
                  <span className="font-medium text-foreground">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="font-semibold text-foreground min-w-[3rem] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative w-full">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
