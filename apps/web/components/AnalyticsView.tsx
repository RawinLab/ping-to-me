"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsViewProps {
  data: any[];
  totalClicks: number;
}

export function AnalyticsView({ data, totalClicks }: AnalyticsViewProps) {
  // Process data for chart (group by date/hour)
  // For MVP, just show raw points or simple grouping
  const chartData = data.map((click) => ({
    time: new Date(click.timestamp).toLocaleTimeString(),
    clicks: 1, // Simplified
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
          <p className="text-3xl font-bold mt-2">{totalClicks}</p>
        </div>
        {/* Add more stats cards here */}
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border h-[400px]">
        <h3 className="text-lg font-medium mb-4">Clicks Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {data.map((click) => (
                <tr key={click.id} className="border-b">
                  <td className="px-4 py-3">
                    {new Date(click.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{click.ip || "-"}</td>
                  <td className="px-4 py-3">{click.country || "-"}</td>
                  <td className="px-4 py-3 truncate max-w-xs">
                    {click.userAgent || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
