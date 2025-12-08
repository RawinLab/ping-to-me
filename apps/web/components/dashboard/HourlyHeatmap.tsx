"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@pingtome/ui";
import { Download } from "lucide-react";
import { useState } from "react";

interface HourlyHeatmapProps {
  data: Array<{
    day: number;
    hour: number;
    count: number;
  }>;
  maxCount: number;
  onExport?: () => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [
  "12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a",
  "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p"
];

export function HourlyHeatmap({ data, maxCount, onExport }: HourlyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(item => {
    const key = `${item.day}-${item.hour}`;
    dataMap.set(key, item.count);
  });

  // Get color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return "bg-gray-100";

    const intensity = Math.min(count / maxCount, 1);

    if (intensity <= 0.2) return "bg-blue-100";
    if (intensity <= 0.4) return "bg-blue-200";
    if (intensity <= 0.6) return "bg-blue-400";
    if (intensity <= 0.8) return "bg-blue-600";
    return "bg-blue-800";
  };

  // Get text color for better contrast
  const getTextColor = (count: number): string => {
    const intensity = Math.min(count / maxCount, 1);
    return intensity > 0.5 ? "text-white" : "text-gray-700";
  };

  const handleMouseEnter = (day: number, hour: number, e: React.MouseEvent) => {
    setHoveredCell({ day, hour });
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-semibold">Activity Heatmap</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Clicks by day and hour
          </p>
        </div>
        {onExport && (
          <Button variant="ghost" size="icon" onClick={onExport}>
            <Download className="h-4 w-4 text-primary" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hours header */}
            <div className="flex mb-2">
              <div className="w-12 flex-shrink-0" />
              <div className="flex gap-0.5">
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {idx % 3 === 0 ? hour : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap grid */}
            {DAYS.map((day, dayIdx) => {
              const dayValue = dayIdx; // 0 = Sunday, 1 = Monday, etc.

              return (
                <div key={day} className="flex mb-0.5">
                  {/* Day label */}
                  <div className="w-12 flex-shrink-0 flex items-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      {day}
                    </span>
                  </div>

                  {/* Hour cells */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 24 }).map((_, hourIdx) => {
                      const key = `${dayValue}-${hourIdx}`;
                      const count = dataMap.get(key) || 0;
                      const isHovered = hoveredCell?.day === dayValue && hoveredCell?.hour === hourIdx;

                      return (
                        <div
                          key={hourIdx}
                          className={`
                            w-8 h-8 rounded-sm cursor-pointer transition-all
                            ${getColor(count)}
                            ${isHovered ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""}
                          `}
                          onMouseEnter={(e) => handleMouseEnter(dayValue, hourIdx, e)}
                          onMouseLeave={handleMouseLeave}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-sm bg-gray-100" />
              <div className="w-6 h-6 rounded-sm bg-blue-100" />
              <div className="w-6 h-6 rounded-sm bg-blue-200" />
              <div className="w-6 h-6 rounded-sm bg-blue-400" />
              <div className="w-6 h-6 rounded-sm bg-blue-600" />
              <div className="w-6 h-6 rounded-sm bg-blue-800" />
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredCell !== null && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translate(-50%, -100%)"
            }}
          >
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
              <div className="font-medium">
                {DAYS[hoveredCell.day]} {HOURS[hoveredCell.hour]}
              </div>
              <div className="text-gray-300">
                {(dataMap.get(`${hoveredCell.day}-${hoveredCell.hour}`) || 0).toLocaleString()} clicks
              </div>
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
                style={{
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #111827"
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
