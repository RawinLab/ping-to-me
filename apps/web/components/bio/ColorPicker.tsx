"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Label,
  Button,
} from "@pingtome/ui";
import { cn } from "@pingtome/ui";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PREDEFINED_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#000000", // Black
  "#374151", // Gray-700
  "#6B7280", // Gray-500
  "#9CA3AF", // Gray-400
  "#D1D5DB", // Gray-300
  "#F3F4F6", // Gray-100
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
  const [hexInput, setHexInput] = React.useState(value);
  const [open, setOpen] = React.useState(false);

  // Sync hexInput with value when popover opens
  React.useEffect(() => {
    if (open) {
      setHexInput(value);
    }
  }, [open, value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setHexInput(color);
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

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <div
              className="h-6 w-6 rounded border border-gray-300"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-left font-mono text-sm">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">Preset Colors</h4>
              <div className="grid grid-cols-6 gap-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded border-2 transition-all hover:scale-110",
                      value.toUpperCase() === color.toUpperCase()
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hex-input" className="text-sm">
                Custom Hex Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="hex-input"
                  type="text"
                  placeholder="#FF5500"
                  value={hexInput}
                  onChange={handleHexInputChange}
                  onBlur={handleHexInputBlur}
                  className="flex-1 font-mono text-sm"
                />
                <div
                  className="h-10 w-10 rounded border border-gray-300 flex-shrink-0"
                  style={{
                    backgroundColor: isValidHexColor(hexInput)
                      ? normalizeHexColor(hexInput)
                      : "#fff",
                  }}
                />
              </div>
              {hexInput && !isValidHexColor(hexInput) && (
                <p className="text-xs text-red-500">
                  Invalid hex color format
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
