"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

interface DayData {
  day: number;
  dayName: string;
  count: number;
  percentage: number;
}

interface DayOfWeekChartProps {
  data: DayData[];
  bestDay?: { dayName: string; count: number };
  worstDay?: { dayName: string; count: number };
  totalClicks: number;
  onExport?: () => void;
}

const CHART_COLORS = {
  default: "#3B82F6",
  best: "#10B981",
  worst: "#EF4444",
};

// Convert day data to chart format (Monday-Sunday)
const reorderToWeekStart = (data: DayData[]) => {
  // Original order: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Desired order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const reorderMap = [1, 2, 3, 4, 5, 6, 0];
  return reorderMap.map((dayIndex) => {
    const dayData = data.find((d) => d.day === dayIndex);
    return dayData || { day: dayIndex, dayName: "", count: 0, percentage: 0 };
  });
};

export function DayOfWeekChart({
  data,
  bestDay,
  worstDay,
  totalClicks,
  onExport,
}: DayOfWeekChartProps) {
  // Reorder data to start with Monday
  const chartData = reorderToWeekStart(data);

  // Get short day names (Mon, Tue, etc.)
  const getShortDayName = (dayName: string) => dayName.substring(0, 3);

  // Determine bar color based on best/worst day
  const getBarColor = (dayName: string) => {
    if (bestDay && dayName === bestDay.dayName) {
      return CHART_COLORS.best;
    }
    if (worstDay && dayName === worstDay.dayName) {
      return CHART_COLORS.worst;
    }
    return CHART_COLORS.default;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">
          Daily Breakdown
        </CardTitle>
        {onExport && (
          <Button variant="ghost" size="icon" onClick={onExport}>
            <Download className="h-4 w-4 text-primary" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey={(item) => getShortDayName(item.dayName)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number, name: string, props: any) => {
                  const percentage = props.payload.percentage;
                  return [
                    `${value.toLocaleString()} clicks (${percentage}%)`,
                    props.payload.dayName,
                  ];
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                name="Clicks"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.dayName)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best/Worst Day Stats */}
        {totalClicks > 0 && (bestDay || worstDay) && (
          <div className="flex justify-center gap-8 mt-6 pt-4 border-t">
            {bestDay && bestDay.count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Best:
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {bestDay.dayName} ({bestDay.count.toLocaleString()} clicks)
                </span>
              </div>
            )}
            {worstDay && worstDay.dayName !== "N/A" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    Worst:
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {worstDay.dayName} ({worstDay.count.toLocaleString()} clicks)
                </span>
              </div>
            )}
          </div>
        )}

        {/* No data state */}
        {totalClicks === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No click data available for the selected period
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
