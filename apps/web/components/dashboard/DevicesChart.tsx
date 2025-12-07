"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";

interface DeviceData {
  name: string;
  value: number;
  color: string;
}

interface DevicesChartProps {
  data: DeviceData[];
  totalClicks: number;
  onExport?: () => void;
}

const CHART_COLORS = {
  desktop: "#3B82F6",
  mobile: "#6366F1",
  tablet: "#06B6D4",
  other: "#8B5CF6",
};

export function DevicesChart({
  data,
  totalClicks,
  onExport,
}: DevicesChartProps) {
  // Add colors to data if not present
  const chartData = data.map((item, index) => ({
    ...item,
    color:
      item.color ||
      Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
  }));

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Devices</CardTitle>
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
                CLICKS
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6 w-full">
            {chartData.map((item) => (
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
