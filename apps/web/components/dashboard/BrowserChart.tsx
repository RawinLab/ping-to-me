"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";

interface BrowserData {
  name: string;
  value: number;
  color?: string;
}

interface BrowserChartProps {
  data: BrowserData[];
  totalClicks: number;
  onExport?: () => void;
}

const BROWSER_COLORS = {
  Chrome: "#4285F4",
  Safari: "#5AC8FA",
  Firefox: "#FF7139",
  Edge: "#0078D7",
  Opera: "#FF1B2D",
  Samsung: "#1428A0",
  Other: "#8B5CF6",
};

export function BrowserChart({
  data,
  totalClicks,
  onExport,
}: BrowserChartProps) {
  // Calculate threshold for "Other" grouping (5% of total)
  const threshold = totalClicks * 0.05;

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Group small browsers into "Other"
  let chartData: BrowserData[] = [];
  let otherValue = 0;

  sortedData.forEach((item) => {
    if (item.value < threshold && chartData.length >= 5) {
      otherValue += item.value;
    } else {
      chartData.push(item);
    }
  });

  // Add "Other" category if needed
  if (otherValue > 0) {
    chartData.push({
      name: "Other",
      value: otherValue,
    });
  }

  // Limit to top 6 items
  chartData = chartData.slice(0, 6);

  // Add colors to data
  const coloredData = chartData.map((item) => ({
    ...item,
    color:
      item.color ||
      BROWSER_COLORS[item.name as keyof typeof BROWSER_COLORS] ||
      BROWSER_COLORS.Other,
  }));

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Browsers</CardTitle>
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
                  data={coloredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {coloredData.map((entry, index) => (
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
                CLICKS
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6 w-full">
            {coloredData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
