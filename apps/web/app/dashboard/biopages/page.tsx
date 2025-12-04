"use client";

import { useState, useEffect } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../../lib/api";

export default function BioPagesList() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const res = await apiRequest("/biopages?orgId=mock-org-id");
      setPages(res);
    } catch (err) {
      console.error("Failed to load bio pages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/biopages", {
        method: "POST",
        body: JSON.stringify({ slug, title, orgId: "mock-org-id" }),
      });
      setSlug("");
      setTitle("");
      loadPages();
    } catch (err) {
      alert("Failed to create bio page");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Bio Pages</h1>

      <div className="border p-6 rounded-lg mb-8 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Bio Page</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Page Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-48 p-2 border rounded"
              required
            />
            <Button>Create Page</Button>
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="border p-4 rounded-lg bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-lg">{page.title}</p>
              <p className="text-gray-500 text-sm">pingto.me/{page.slug}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/dashboard/biopages/${page.slug}/edit`}
                className="text-blue-600 hover:underline px-3 py-1 border rounded"
              >
                Edit
              </a>
              <a
                href={`/dashboard/biopages/${page.slug}/analytics`}
                className="text-purple-600 hover:underline px-3 py-1 border rounded"
              >
                Analytics
              </a>
              <a
                href={`http://localhost:8787/${page.slug}`}
                target="_blank"
                className="text-gray-600 hover:underline px-3 py-1"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
