"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../../../../lib/api";

export default function BioPageBuilder() {
  const params = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (params.slug) {
      loadPage(params.slug as string);
    }
  }, [params.slug]);

  const loadPage = async (slug: string) => {
    try {
      const res = await apiRequest(`/biopages/${slug}`);
      setPage(res);
      setTitle(res.title);
      setDescription(res.description || "");
      setLinks(res.content?.links || []);
    } catch (err) {
      console.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiRequest(`/biopages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          content: { links },
        }),
      });
      alert("Saved successfully!");
    } catch (err) {
      alert("Failed to save");
    }
  };

  const addLink = () => {
    setLinks([...links, { title: "New Link", url: "https://" }]);
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!page) return <div className="p-8">Page not found</div>;

  return (
    <div className="flex h-screen">
      {/* Editor Sidebar */}
      <div className="w-1/2 p-8 border-r overflow-y-auto bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Edit Bio Page</h1>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Links</h2>
              <button
                onClick={addLink}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add Link
              </button>
            </div>
            <div className="space-y-4">
              {links.map((link, i) => (
                <div
                  key={i}
                  className="p-4 border rounded bg-gray-50 relative group"
                >
                  <button
                    onClick={() => removeLink(i)}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateLink(i, "title", e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Link Title"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(i, "url", e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="URL"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Live Preview */}
      <div className="w-1/2 bg-gray-100 flex items-center justify-center p-8">
        <div className="w-[375px] h-[667px] bg-white rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-b-xl mx-auto w-32 z-10"></div>
          <div className="h-full overflow-y-auto p-6 pt-12 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">{title || "Page Title"}</h2>
            <p className="text-gray-600 mb-8 text-sm">
              {description || "Description goes here..."}
            </p>

            <div className="space-y-3">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  className="block w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
