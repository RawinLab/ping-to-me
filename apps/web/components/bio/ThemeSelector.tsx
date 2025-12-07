"use client";

import * as React from "react";
import { Card, CardContent } from "@pingtome/ui";
import {
  THEME_PRESETS,
  THEME_NAMES,
  THEME_METADATA,
  type ThemeName,
  type BioPageTheme,
} from "@/lib/biopage-themes";
import { Check } from "lucide-react";

interface ThemeSelectorProps {
  value: string;
  onChange: (themeName: string) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const handleThemeClick = (themeName: string) => {
    onChange(themeName);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {THEME_NAMES.map((themeName) => {
          const theme = THEME_PRESETS[themeName];
          const metadata = THEME_METADATA[themeName];
          const isSelected = value === themeName;

          return (
            <ThemeCard
              key={themeName}
              theme={theme}
              label={metadata.label}
              description={metadata.description}
              isSelected={isSelected}
              onClick={() => handleThemeClick(themeName)}
            />
          );
        })}

        {/* Custom Theme Option */}
        <button
          type="button"
          onClick={() => handleThemeClick("custom")}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all"
        >
          <Card
            className={`relative overflow-hidden transition-all hover:shadow-md ${
              value === "custom" ? "ring-2 ring-blue-500 shadow-md" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="w-full h-24 rounded-md mb-3 relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-xs font-bold">CUSTOM</div>
                </div>
                {value === "custom" && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Custom
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  Create your own custom theme
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: BioPageTheme;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeCard({
  theme,
  label,
  description,
  isSelected,
  onClick,
}: ThemeCardProps) {
  const getBackgroundStyle = (): React.CSSProperties => {
    if (theme.backgroundType === "gradient" && theme.backgroundGradient) {
      return {
        background: theme.backgroundGradient,
      };
    }
    return {
      backgroundColor: theme.backgroundColor,
    };
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all"
    >
      <Card
        className={`relative overflow-hidden transition-all hover:shadow-md ${
          isSelected ? "ring-2 ring-blue-500 shadow-md" : ""
        }`}
      >
        <CardContent className="p-4">
          {/* Theme Preview */}
          <div
            className="w-full h-24 rounded-md mb-3 relative overflow-hidden"
            style={getBackgroundStyle()}
          >
            {/* Mini button preview inside the theme box */}
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div
                className="w-full h-8 rounded flex items-center justify-center text-xs font-medium transition-all"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                }}
              >
                Sample Button
              </div>
            </div>

            {/* Selection indicator in top-right corner */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Theme Name */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
