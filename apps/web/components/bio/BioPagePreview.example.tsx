"use client";

import { BioPagePreview } from "./BioPagePreview";
import { THEME_PRESETS } from "@/lib/biopage-themes";

/**
 * Example usage of BioPagePreview component
 *
 * This demonstrates how to integrate the mobile preview
 * into a bio page editor interface.
 */
export default function BioPagePreviewExample() {
  // Example bio page data
  const exampleData = {
    title: "John Doe",
    description: "Product Designer | Coffee Enthusiast | Travel Lover",
    avatarUrl: "https://github.com/shadcn.png",
    theme: THEME_PRESETS.dark, // or use any theme preset
    layout: "stacked" as const,
    bioLinks: [
      {
        id: "1",
        title: "My Portfolio",
        description: "Check out my latest design work",
        externalUrl: "https://example.com/portfolio",
      },
      {
        id: "2",
        title: "Blog",
        description: "Read my thoughts on design and tech",
        externalUrl: "https://example.com/blog",
      },
      {
        id: "3",
        title: "Shop My Store",
        description: "Exclusive merch and products",
        externalUrl: "https://example.com/shop",
      },
      {
        id: "4",
        title: "Book a Call",
        description: "Schedule a 1-on-1 consultation",
        externalUrl: "https://example.com/booking",
      },
    ],
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/johndoe" },
      { platform: "twitter", url: "https://twitter.com/johndoe" },
      { platform: "linkedin", url: "https://linkedin.com/in/johndoe" },
      { platform: "github", url: "https://github.com/johndoe" },
    ],
    showBranding: true,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bio Page Preview Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel (Left) */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Editor Controls</h2>
              <p className="text-gray-600 text-sm">
                This is where your bio page editor form would go. The preview
                on the right updates in real-time as you make changes.
              </p>

              {/* Example controls */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={exampleData.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={exampleData.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Dark</option>
                    <option>Minimal</option>
                    <option>Colorful</option>
                    <option>Neon</option>
                    <option>Gradient</option>
                    <option>Pastel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layout
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Stacked</option>
                    <option>Grid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel (Right) */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Mobile Preview
              </h2>
              <BioPagePreview {...exampleData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example with Grid Layout
 */
export function GridLayoutExample() {
  const gridData = {
    title: "Jane Smith",
    description: "Content Creator & Influencer",
    avatarUrl: "https://github.com/shadcn.png",
    theme: THEME_PRESETS.gradient,
    layout: "grid" as const,
    bioLinks: [
      {
        id: "1",
        title: "YouTube",
        externalUrl: "https://youtube.com/@janesmith",
      },
      {
        id: "2",
        title: "TikTok",
        externalUrl: "https://tiktok.com/@janesmith",
      },
      {
        id: "3",
        title: "Newsletter",
        externalUrl: "https://example.com/newsletter",
      },
      {
        id: "4",
        title: "Merch",
        externalUrl: "https://example.com/shop",
      },
      {
        id: "5",
        title: "Podcast",
        externalUrl: "https://example.com/podcast",
      },
      {
        id: "6",
        title: "Contact",
        externalUrl: "mailto:jane@example.com",
      },
    ],
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/janesmith" },
      { platform: "twitter", url: "https://twitter.com/janesmith" },
      { platform: "youtube", url: "https://youtube.com/@janesmith" },
    ],
    showBranding: true,
  };

  return <BioPagePreview {...gridData} />;
}

/**
 * Example with all theme presets
 */
export function AllThemesExample() {
  const baseData = {
    title: "Theme Preview",
    description: "Showcasing different theme options",
    bioLinks: [
      { id: "1", title: "Link 1", externalUrl: "#" },
      { id: "2", title: "Link 2", externalUrl: "#" },
      { id: "3", title: "Link 3", externalUrl: "#" },
    ],
    layout: "stacked" as const,
    socialLinks: [
      { platform: "twitter", url: "#" },
      { platform: "instagram", url: "#" },
    ],
    showBranding: true,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {Object.entries(THEME_PRESETS).map(([name, theme]) => (
        <div key={name}>
          <h3 className="text-lg font-semibold mb-2 capitalize text-center">
            {name}
          </h3>
          <BioPagePreview {...baseData} theme={theme} />
        </div>
      ))}
    </div>
  );
}
