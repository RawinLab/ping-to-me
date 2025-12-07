"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { Download, ChevronDown, ChevronUp } from "lucide-react";

interface LocationData {
  name: string;
  value: number;
  percentage: number;
}

interface LocationsChartProps {
  countries: LocationData[];
  cities?: LocationData[];
  onExport?: () => void;
}

const CHART_COLORS = {
  blue: "#3B82F6",
  indigo: "#6366F1",
};

export function LocationsChart({
  countries,
  cities = [],
  onExport,
}: LocationsChartProps) {
  const [activeTab, setActiveTab] = useState<"countries" | "cities">(
    "countries",
  );
  const [expanded, setExpanded] = useState(false);
  const data = activeTab === "countries" ? countries : cities;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const displayCount = expanded ? data.length : 5;
  const hasMore = data.length > 5;

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Locations</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-full p-1">
            <button
              onClick={() => {
                setActiveTab("countries");
                setExpanded(false);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeTab === "countries"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Countries
            </button>
            <button
              onClick={() => {
                setActiveTab("cities");
                setExpanded(false);
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeTab === "cities"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cities
            </button>
          </div>
          {onExport && (
            <Button variant="ghost" size="icon" onClick={onExport}>
              <Download className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center text-sm text-muted-foreground pb-2 border-b">
            <span className="w-6">#</span>
            <span>{activeTab === "countries" ? "Country" : "City"}</span>
            <span className="text-right">Clicks</span>
            <span className="w-12 text-right">%</span>
          </div>
          <div
            className={`space-y-3 transition-all duration-300 ${expanded ? "" : "max-h-[240px]"} overflow-hidden`}
          >
            {data.slice(0, displayCount).map((item, index) => (
              <div
                key={item.name}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center"
              >
                <span className="w-6 text-sm text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[100px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: CHART_COLORS.blue,
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
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No location data available
            </p>
          )}
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
                  Show {data.length - 5} more
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
