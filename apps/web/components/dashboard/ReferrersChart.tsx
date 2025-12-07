"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ReferrerData {
  name: string;
  value: number;
  percentage: number;
}

interface ReferrersChartProps {
  data: ReferrerData[];
  totalClicks: number;
  onExport?: () => void;
}

const CHART_COLORS = [
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#F97316", // orange
  "#10B981", // green
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#EAB308", // yellow
  "#14B8A6", // teal
];

// Format referrer URL for display
function formatReferrer(referrer: string): {
  display: string;
  url: string | null;
} {
  if (referrer === "direct" || !referrer) {
    return { display: "Direct / None", url: null };
  }

  try {
    // Check if it's already a URL
    if (referrer.startsWith("http://") || referrer.startsWith("https://")) {
      const url = new URL(referrer);
      return { display: referrer, url: referrer };
    }
    // If it's just a domain
    return { display: `https://${referrer}`, url: `https://${referrer}` };
  } catch {
    return { display: referrer, url: null };
  }
}

export function ReferrersChart({
  data,
  totalClicks,
  onExport,
}: ReferrersChartProps) {
  const [expanded, setExpanded] = useState(false);

  const chartData = data.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const displayCount = expanded ? data.length : 5;
  const hasMore = data.length > 5;

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Referrers</CardTitle>
        {onExport && (
          <Button variant="ghost" size="icon" onClick={onExport}>
            <Download className="h-4 w-4 text-primary" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">
                {totalClicks.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                ENGAGEMENT
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-6 w-full">
            {chartData.slice(0, displayCount).map((item) => {
              const { display, url } = formatReferrer(item.name);
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate flex items-center gap-1"
                        title={display}
                      >
                        <span className="truncate">{display}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span
                        className="text-sm text-muted-foreground truncate"
                        title={display}
                      >
                        {display}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
            {data.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No referrer data available
              </p>
            )}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mt-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {data.length - 5} more
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
