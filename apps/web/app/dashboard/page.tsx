"use client";

import { useState, useEffect } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";
import { QrCodeModal } from "../../components/QrCodeModal";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const res = await apiRequest("/links?orgId=mock-org-id");
      setLinks(res);
    } catch (err) {
      console.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/links", {
        method: "POST",
        body: JSON.stringify({ url, slug, orgId: "mock-org-id" }),
      });
      setUrl("");
      setSlug("");
      loadLinks(); // Refresh list
    } catch (err) {
      alert("Failed to create link");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiRequest(`/links/${id}`, { method: "DELETE" });
      loadLinks();
    } catch (err) {
      alert("Failed to delete link");
    }
  };

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<{
    url: string;
    slug: string;
  } | null>(null);

  const openQrModal = (link: any) => {
    setSelectedLink({ url: link.destinationUrl, slug: link.slug });
    setQrModalOpen(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="border p-4 rounded-lg bg-white shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-lg">/{link.slug}</p>
                  <p className="text-gray-500 text-sm truncate max-w-md">
                    {link.destinationUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openQrModal(link)}
                    className="text-gray-600 hover:bg-gray-50 px-3 py-1 rounded border"
                  >
                    QR
                  </button>
                  <a
                    href={`/dashboard/analytics/${link.id}`}
                    className="text-blue-600 hover:underline px-3 py-1"
                  >
                    Analytics
                  </a>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLink && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          linkUrl={selectedLink.url}
          slug={selectedLink.slug}
        />
      )}
    </div>
  );
}
