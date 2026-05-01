"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Label,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pingtome/ui";
import { cn } from "@pingtome/ui";
import { Check, Pipette, Palette } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PREDEFINED_COLORS = [
  { color: "#EF4444", name: "Red" },
  { color: "#F97316", name: "Orange" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#EAB308", name: "Yellow" },
  { color: "#84CC16", name: "Lime" },
  { color: "#22C55E", name: "Green" },
  { color: "#14B8A6", name: "Teal" },
  { color: "#06B6D4", name: "Cyan" },
  { color: "#3B82F6", name: "Blue" },
  { color: "#8B5CF6", name: "Violet" },
  { color: "#A855F7", name: "Purple" },
  { color: "#EC4899", name: "Pink" },
  { color: "#000000", name: "Black" },
  { color: "#374151", name: "Dark Gray" },
  { color: "#6B7280", name: "Gray" },
  { color: "#9CA3AF", name: "Light Gray" },
  { color: "#D1D5DB", name: "Silver" },
  { color: "#F3F4F6", name: "White" },
];

function isValidHexColor(color: string): boolean {
  // Accept with or without # prefix
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

function normalizeHexColor(color: string): string {
  // Ensure color starts with #
  const normalized = color.startsWith("#") ? color : `#${color}`;
  // Convert 3-digit hex to 6-digit
  if (normalized.length === 4) {
    const r = normalized.charAt(1);
    const g = normalized.charAt(2);
    const b = normalized.charAt(3);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return normalized.toUpperCase();
}

/**
 * ColorPicker component for selecting colors with predefined palette and custom hex input
 * Displays a color swatch button that opens a popover with color options
 */
export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const t = useTranslations("bio");
  const [hexInput, setHexInput] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  const [recentColors, setRecentColors] = React.useState<string[]>([]);

  // Sync hexInput with value when popover opens
  React.useEffect(() => {
    if (open) {
      setHexInput(value);
    }
  }, [open, value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setHexInput(color);

    // Add to recent colors (max 6, no duplicates)
    setRecentColors((prev) => {
      const updated = [
        color,
        ...prev.filter((c) => c.toUpperCase() !== color.toUpperCase()),
      ];
      return updated.slice(0, 6);
    });
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setHexInput(input);

    // Validate and update if valid
    if (isValidHexColor(input)) {
      const normalized = normalizeHexColor(input);
      onChange(normalized);
    }
  };

  const handleHexInputBlur = () => {
    // If invalid, reset to current value
    if (!isValidHexColor(hexInput)) {
      setHexInput(value);
    } else {
      // Normalize the value
      const normalized = normalizeHexColor(hexInput);
      onChange(normalized);
      setHexInput(normalized);
    }
  };

  const isInputValid = isValidHexColor(hexInput);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 hover:bg-gray-50 transition-colors"
          >
            <div
              className="h-6 w-6 rounded border border-gray-300 shadow-sm relative overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: value }}
              />
            </div>
            <span className="flex-1 text-left font-mono text-sm">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 shadow-lg" align="start">
          <div className="space-y-4">
            {/* Recently Used Colors */}
            {recentColors.length > 0 && (
              <div className="pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-gray-600" />
                  <h4 className="font-semibold text-sm text-gray-700">
                    Recent
                  </h4>
                </div>
                <div className="flex gap-2">
                  {recentColors.map((color) => (
                    <TooltipProvider key={color}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "h-8 w-8 rounded-md border-2 transition-all hover:scale-110 relative overflow-hidden shadow-sm",
                              value.toUpperCase() === color.toUpperCase()
                                ? "border-primary ring-2 ring-primary ring-offset-1"
                                : "border-gray-300 hover:border-gray-400",
                            )}
                            style={{
                              backgroundImage:
                                "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                              backgroundSize: "6px 6px",
                              backgroundPosition:
                                "0 0, 0 3px, 3px -3px, -3px 0px",
                            }}
                            onClick={() => handleColorSelect(color)}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: color }}
                            />
                            {value.toUpperCase() === color.toUpperCase() && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check
                                  className="h-4 w-4 text-white drop-shadow-md"
                                  strokeWidth={3}
                                />
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs font-mono">{color}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}

            {/* Preset Colors */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700">
                Preset Colors
              </h4>
              <TooltipProvider>
                <div className="grid grid-cols-6 gap-2">
                  {PREDEFINED_COLORS.map(({ color, name }) => (
                    <Tooltip key={color}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "h-8 w-8 rounded-md border-2 transition-all hover:scale-110 relative shadow-sm",
                            value.toUpperCase() === color.toUpperCase()
                              ? "border-primary ring-2 ring-primary ring-offset-1"
                              : "border-gray-300 hover:border-gray-400",
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorSelect(color)}
                        >
                          {value.toUpperCase() === color.toUpperCase() && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check
                                className="h-4 w-4 text-white drop-shadow-md"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{name}</p>
                        <p className="text-xs font-mono text-gray-400">
                          {color}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Custom Hex Color */}
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Pipette className="h-4 w-4 text-gray-600" />
                <Label
                  htmlFor="hex-input"
                  className="text-sm font-semibold text-gray-700"
                >
                  Custom Hex
                </Label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="hex-input"
                    type="text"
                    placeholder="#FF5500"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    onBlur={handleHexInputBlur}
                    className={cn(
                      "font-mono text-sm pr-8",
                      hexInput &&
                        !isInputValid &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                  {hexInput && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {isInputValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            !
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className="h-10 w-10 rounded-md border-2 border-gray-300 flex-shrink-0 shadow-sm relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: isInputValid
                        ? normalizeHexColor(hexInput)
                        : "#fff",
                    }}
                  />
                </div>
              </div>
              {hexInput && !isInputValid && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                  Invalid hex color format (e.g., #FF5500)
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
