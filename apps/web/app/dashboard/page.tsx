"use client";

import { useState } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";
import { LinksTable } from "../../components/links/LinksTable";
import { QrCodeModal } from "../../components/QrCodeModal";

import { ImportLinksModal } from "../../components/links/ImportLinksModal";
import { Download, Upload } from "lucide-react";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/links", {
        method: "POST",
        body: JSON.stringify({ originalUrl: url, slug }),
      });
      setUrl("");
      setSlug("");
      setRefreshKey((prev) => prev + 1); // Trigger table refresh
    } catch (err) {
      alert("Failed to create link");
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "links.csv";
      a.click();
    } catch (err) {
      alert("Failed to export links");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <ImportLinksModal onSuccess={() => setRefreshKey((prev) => prev + 1)}>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </ImportLinksModal>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="border p-6 rounded-lg mb-8 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Link</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="url"
              placeholder="Destination URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Slug (Optional)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-48 p-2 border rounded"
            />
            <Button>Create Link</Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Links</h2>
        <LinksTable key={refreshKey} />
      </div>
    </div>
  );
}
