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
          theme: page.theme,
          buttonColor: page.buttonColor,
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

  const isDark = page.theme === "dark";
  const buttonStyle = {
    backgroundColor: page.buttonColor || (isDark ? "#333" : "#f3f4f6"),
    color: page.buttonColor ? "#fff" : isDark ? "#fff" : "#000",
    borderColor: page.buttonColor || (isDark ? "#444" : "#e5e7eb"),
  };

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
            <h2 className="text-lg font-semibold mb-4">Theme</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={page?.theme || "light"}
                  onChange={(e) => setPage({ ...page, theme: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Button Color
                </label>
                <input
                  type="color"
                  value={page?.buttonColor || "#000000"}
                  onChange={(e) =>
                    setPage({ ...page, buttonColor: e.target.value })
                  }
                  className="w-full h-10 p-1 border rounded"
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
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => {
                        if (i > 0) {
                          const newLinks = [...links];
                          [newLinks[i - 1], newLinks[i]] = [
                            newLinks[i],
                            newLinks[i - 1],
                          ];
                          setLinks(newLinks);
                        }
                      }}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => {
                        if (i < links.length - 1) {
                          const newLinks = [...links];
                          [newLinks[i + 1], newLinks[i]] = [
                            newLinks[i],
                            newLinks[i + 1],
                          ];
                          setLinks(newLinks);
                        }
                      }}
                      disabled={i === links.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeLink(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2 pr-16">
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
        <div
          className={`w-[375px] h-[667px] rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative ${isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
        >
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-b-xl mx-auto w-32 z-10"></div>
          <div className="h-full overflow-y-auto p-6 pt-12 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">{title || "Page Title"}</h2>
            <p
              className={`mb-8 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {description || "Description goes here..."}
            </p>

            <div className="space-y-3">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  className="block w-full p-3 border rounded-lg transition-colors text-sm font-medium"
                  style={buttonStyle}
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
