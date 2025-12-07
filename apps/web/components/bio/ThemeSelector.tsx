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
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg transition-all group"
        >
          <Card
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              value === "custom"
                ? "ring-[3px] ring-blue-500 shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <CardContent className="p-4">
              <div className="w-full h-24 rounded-md mb-3 relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 transition-all duration-200">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm" />
                  <div className="w-full space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-white/30 backdrop-blur-sm" />
                    <div className="w-full h-3 rounded-full bg-white/30 backdrop-blur-sm" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-xs font-bold drop-shadow-md">
                    CUSTOM
                  </div>
                </div>
                {value === "custom" && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  Custom
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 transition-colors duration-200">
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
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg transition-all group"
    >
      <Card
        className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
          isSelected ? "ring-[3px] ring-blue-500 shadow-lg" : "hover:shadow-md"
        }`}
      >
        <CardContent className="p-4">
          {/* Theme Preview */}
          <div
            className="w-full h-24 rounded-md mb-3 relative overflow-hidden transition-all duration-200"
            style={getBackgroundStyle()}
          >
            {/* Mini bio page preview with avatar and buttons */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-full border-2 transition-all duration-200"
                style={{
                  borderColor: theme.textColor,
                  backgroundColor: `${theme.textColor}20`,
                }}
              />
              {/* Button placeholders */}
              <div className="w-full space-y-1.5">
                <div
                  className="w-full h-3 rounded transition-all duration-200"
                  style={{
                    backgroundColor: theme.buttonColor,
                    borderRadius:
                      theme.buttonStyle === "pill"
                        ? "9999px"
                        : theme.buttonStyle === "square"
                          ? "2px"
                          : "4px",
                  }}
                />
                <div
                  className="w-full h-3 rounded transition-all duration-200"
                  style={{
                    backgroundColor: theme.buttonColor,
                    borderRadius:
                      theme.buttonStyle === "pill"
                        ? "9999px"
                        : theme.buttonStyle === "square"
                          ? "2px"
                          : "4px",
                  }}
                />
              </div>
            </div>

            {/* Selection indicator in top-right corner */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Theme Name */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 transition-colors duration-200">
              {label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 transition-colors duration-200">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
