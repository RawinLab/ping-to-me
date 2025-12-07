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
  Legend,
} from "recharts";
import { Download } from "lucide-react";

interface EngagementsChartProps {
  data: Array<{
    date: string;
    linkClicks?: number;
    qrScans?: number;
    bioPageClicks?: number;
    clicks?: number;
  }>;
  onExport?: () => void;
}

const CHART_COLORS = {
  blue: "#3B82F6",
  indigo: "#6366F1",
  cyan: "#06B6D4",
};

export function EngagementsChart({ data, onExport }: EngagementsChartProps) {
  // Check if we have detailed breakdown or just total clicks
  const hasDetailedData = data.some(
    (d) => d.linkClicks !== undefined || d.qrScans !== undefined,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">
          Engagements over time
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
            <BarChart data={data} barGap={0} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="date"
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
              />
              {hasDetailedData ? (
                <>
                  <Bar
                    dataKey="linkClicks"
                    stackId="a"
                    fill={CHART_COLORS.blue}
                    radius={[0, 0, 0, 0]}
                    name="Link clicks"
                  />
                  <Bar
                    dataKey="qrScans"
                    stackId="a"
                    fill={CHART_COLORS.indigo}
                    radius={[0, 0, 0, 0]}
                    name="QR Code scans"
                  />
                  <Bar
                    dataKey="bioPageClicks"
                    stackId="a"
                    fill={CHART_COLORS.cyan}
                    radius={[4, 4, 0, 0]}
                    name="Bio page clicks"
                  />
                </>
              ) : (
                <Bar
                  dataKey="clicks"
                  fill={CHART_COLORS.blue}
                  radius={[4, 4, 0, 0]}
                  name="Clicks"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {hasDetailedData && (
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: CHART_COLORS.blue }}
              />
              <span className="text-sm text-muted-foreground">Link clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: CHART_COLORS.indigo }}
              />
              <span className="text-sm text-muted-foreground">
                QR Code scans
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: CHART_COLORS.cyan }}
              />
              <span className="text-sm text-muted-foreground">
                Bio page clicks
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
