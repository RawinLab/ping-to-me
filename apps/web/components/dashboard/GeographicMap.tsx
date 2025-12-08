"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { Download, Map, List, Globe, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";

interface CountryData {
  name: string;
  code?: string; // ISO 3166-1 alpha-2 country code
  value: number;
  percentage?: number;
}

interface GeographicMapProps {
  data: CountryData[];
  totalClicks: number;
  onCountryClick?: (countryCode: string) => void;
  onExport?: () => void;
}

/**
 * Converts ISO 3166-1 alpha-2 country code to flag emoji
 * @param code - Two-letter country code (e.g., "US", "GB", "FR")
 * @returns Flag emoji or globe emoji if code is invalid
 */
const getCountryFlag = (code?: string): string => {
  if (!code || code.length !== 2) return "🌍";

  try {
    const codePoints = code
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌍";
  }
};

/**
 * Generates a color based on value intensity
 * Uses a blue scale from light (low values) to dark (high values)
 */
const getColor = (value: number, maxValue: number): string => {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  const hue = 210; // Blue
  const saturation = 80;
  const lightness = Math.round(90 - intensity * 50); // 90% to 40%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Custom tooltip for the bar chart
 */
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CountryData;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{getCountryFlag(data.code)}</span>
          <span className="font-semibold text-foreground">{data.name}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between gap-4">
            <span>Clicks:</span>
            <span className="font-medium text-foreground">
              {data.value.toLocaleString()}
            </span>
          </div>
          {data.percentage !== undefined && (
            <div className="flex justify-between gap-4">
              <span>Share:</span>
              <span className="font-medium text-foreground">
                {data.percentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function GeographicMap({
  data,
  totalClicks,
  onCountryClick,
  onExport,
}: GeographicMapProps) {
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");
  const [expanded, setExpanded] = useState(false);

  // Process and sort data
  const processedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return sorted.map((item) => ({
      ...item,
      percentage:
        item.percentage !== undefined
          ? item.percentage
          : totalClicks > 0
            ? Math.round((item.value / totalClicks) * 100 * 10) / 10
            : 0,
    }));
  }, [data, totalClicks]);

  // Get top countries and calculate "Others"
  const topCountries = processedData.slice(0, 10);
  const maxValue = topCountries[0]?.value || 0;

  // Calculate "Others" if there are more than 10 countries
  const othersData = useMemo(() => {
    if (processedData.length <= 10) return null;

    const othersCount = processedData
      .slice(10)
      .reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = totalClicks > 0
      ? Math.round((othersCount / totalClicks) * 100 * 10) / 10
      : 0;

    return {
      name: "Others",
      code: undefined,
      value: othersCount,
      percentage: othersPercentage,
    };
  }, [processedData, totalClicks]);

  const chartData = othersData
    ? [...topCountries, othersData]
    : topCountries;

  const displayCount = expanded ? processedData.length : 10;
  const hasMore = processedData.length > 10;

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-semibold">
            Geographic Distribution
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-muted rounded-full p-1">
            <button
              onClick={() => setViewMode("chart")}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "chart"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Chart view"
            >
              <Map className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Export button */}
          {onExport && (
            <Button variant="ghost" size="icon" onClick={onExport}>
              <Download className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No geographic data available
            </p>
          </div>
        ) : viewMode === "chart" ? (
          // Chart View - Horizontal Bar Chart
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={({ x, y, payload }) => {
                    const country = chartData.find(
                      (c) => c.name === payload.value
                    );
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={-10}
                          y={0}
                          textAnchor="end"
                          fill="currentColor"
                          className="text-sm"
                          dominantBaseline="middle"
                        >
                          <tspan fontSize="16" dy="-2">
                            {getCountryFlag(country?.code)}
                          </tspan>
                          <tspan dx="6">{payload.value}</tspan>
                        </text>
                      </g>
                    );
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data.code && onCountryClick) {
                      onCountryClick(data.code);
                    }
                  }}
                  className={onCountryClick ? "cursor-pointer" : ""}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(entry.value, maxValue)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {processedData.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Countries
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {totalClicks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Clicks
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {topCountries[0]?.percentage || 0}%
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Top Country
                </div>
              </div>
            </div>
          </div>
        ) : (
          // List View - Detailed list with progress bars
          <div className="space-y-3">
            <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 items-center text-sm text-muted-foreground pb-2 border-b">
              <span className="w-6">#</span>
              <span className="w-8"></span>
              <span>Country</span>
              <span className="text-right">Clicks</span>
              <span className="w-12 text-right">%</span>
            </div>

            <div
              className={`space-y-3 transition-all duration-300 ${expanded ? "" : "max-h-[400px]"} overflow-hidden`}
            >
              {processedData.slice(0, displayCount).map((item, index) => (
                <div
                  key={item.code || item.name}
                  className={`grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 items-center ${
                    onCountryClick && item.code
                      ? "cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                      : ""
                  }`}
                  onClick={() => {
                    if (item.code && onCountryClick) {
                      onCountryClick(item.code);
                    }
                  }}
                >
                  <span className="w-6 text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="w-8 text-2xl">
                    {getCountryFlag(item.code)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-[120px]">
                      {item.name}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[100px]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.value / maxValue) * 100}%`,
                          backgroundColor: getColor(item.value, maxValue),
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-right">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="w-12 text-sm text-muted-foreground text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {processedData.length - 10} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
