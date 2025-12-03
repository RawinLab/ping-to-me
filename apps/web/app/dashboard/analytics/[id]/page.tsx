"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AnalyticsView } from "../../../components/AnalyticsView";
import { apiRequest } from "../../../lib/api";

export default function AnalyticsPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadAnalytics(params.id as string);
    }
  }, [params.id]);

  const loadAnalytics = async (id: string) => {
    try {
      const res = await apiRequest(`/links/${id}/analytics`);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;
  if (!data) return <div className="p-8">Failed to load data</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <a
          href="/dashboard"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold">Link Analytics</h1>
      </div>

      <AnalyticsView data={data.recentClicks} totalClicks={data.totalClicks} />
    </div>
  );
}
