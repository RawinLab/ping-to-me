"use client";

import * as React from "react";
import { Card, CardContent } from "@pingtome/ui";
import { Check } from "lucide-react";

interface FontOption {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  category: "sans-serif" | "serif" | "monospace";
  preview: string;
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: "inter",
    name: "Inter",
    description: "Clean and modern",
    fontFamily: "Inter, system-ui, sans-serif",
    category: "sans-serif",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "poppins",
    name: "Poppins",
    description: "Friendly and approachable",
    fontFamily: "Poppins, system-ui, sans-serif",
    category: "sans-serif",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    description: "Elegant and sophisticated",
    fontFamily: '"Playfair Display", Georgia, serif',
    category: "serif",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono",
    description: "Technical and precise",
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    category: "monospace",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "roboto",
    name: "Roboto",
    description: "Simple and versatile",
    fontFamily: "Roboto, system-ui, sans-serif",
    category: "sans-serif",
    preview: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "opensans",
    name: "Open Sans",
    description: "Readable and neutral",
    fontFamily: '"Open Sans", system-ui, sans-serif',
    category: "sans-serif",
    preview: "The quick brown fox jumps over the lazy dog",
  },
];

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  // Load Google Fonts dynamically
  React.useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleFontClick = (fontFamily: string) => {
    onChange(fontFamily);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {FONT_OPTIONS.map((font) => {
          const isSelected = value === font.fontFamily;

          return (
            <FontCard
              key={font.id}
              font={font}
              isSelected={isSelected}
              onClick={() => handleFontClick(font.fontFamily)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface FontCardProps {
  font: FontOption;
  isSelected: boolean;
  onClick: () => void;
}

function FontCard({ font, isSelected, onClick }: FontCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg transition-all group"
    >
      <Card
        className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
          isSelected ? "ring-[3px] ring-blue-500 shadow-lg" : "hover:shadow-md"
        }`}
      >
        <CardContent className="p-4">
          {/* Font Preview */}
          <div className="w-full min-h-[96px] rounded-md mb-3 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-200 p-4 flex flex-col justify-center">
            {/* Font name in its own font */}
            <h4
              className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 truncate"
              style={{ fontFamily: font.fontFamily }}
            >
              {font.name}
            </h4>
            {/* Sample text */}
            <p
              className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed"
              style={{ fontFamily: font.fontFamily }}
            >
              {font.preview}
            </p>

            {/* Selection indicator in top-right corner */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Font Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 transition-colors duration-200">
              {font.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 transition-colors duration-200">
              {font.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
