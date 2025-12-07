"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
} from "@pingtome/ui";
import { ColorPicker } from "@/components/bio/ColorPicker";
import { cn } from "@pingtome/ui";

interface BackgroundPickerProps {
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  onChange: (updates: {
    backgroundType: "solid" | "gradient" | "image";
    backgroundColor?: string;
    backgroundGradient?: string;
    backgroundImage?: string;
  }) => void;
}

type GradientDirection = "vertical" | "horizontal" | "diagonal";

interface GradientConfig {
  startColor: string;
  endColor: string;
  direction: GradientDirection;
}

/**
 * Parse gradient string to extract colors and direction
 */
function parseGradient(gradient?: string): GradientConfig {
  const defaultConfig: GradientConfig = {
    startColor: "#667eea",
    endColor: "#764ba2",
    direction: "vertical",
  };

  if (!gradient) return defaultConfig;

  // Match linear-gradient pattern
  const match = gradient.match(
    /linear-gradient\((to\s+(?:bottom|right|bottom right)),\s*([^,]+),\s*([^)]+)\)/
  );

  if (!match) return defaultConfig;

  const [, direction, startColor, endColor] = match;

  let parsedDirection: GradientDirection = "vertical";
  if (direction === "to right") parsedDirection = "horizontal";
  else if (direction === "to bottom right") parsedDirection = "diagonal";

  return {
    startColor: startColor.trim(),
    endColor: endColor.trim(),
    direction: parsedDirection,
  };
}

/**
 * Build gradient CSS string from config
 */
function buildGradient(config: GradientConfig): string {
  const directionMap: Record<GradientDirection, string> = {
    vertical: "to bottom",
    horizontal: "to right",
    diagonal: "to bottom right",
  };

  return `linear-gradient(${directionMap[config.direction]}, ${config.startColor}, ${config.endColor})`;
}

/**
 * BackgroundPicker component for bio page backgrounds
 * Supports solid colors, gradients, and images
 */
export function BackgroundPicker({
  backgroundType,
  backgroundColor,
  backgroundGradient,
  backgroundImage,
  onChange,
}: BackgroundPickerProps) {
  const [gradientConfig, setGradientConfig] = React.useState<GradientConfig>(
    () => parseGradient(backgroundGradient)
  );
  const [imageUrl, setImageUrl] = React.useState(backgroundImage || "");
  const [imageOpacity, setImageOpacity] = React.useState(100);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newType = value as "solid" | "gradient" | "image";
    onChange({
      backgroundType: newType,
      backgroundColor,
      backgroundGradient,
      backgroundImage,
    });
  };

  // Handle solid color change
  const handleSolidColorChange = (color: string) => {
    onChange({
      backgroundType: "solid",
      backgroundColor: color,
      backgroundGradient,
      backgroundImage,
    });
  };

  // Handle gradient changes
  const handleGradientChange = (
    updates: Partial<GradientConfig>
  ) => {
    const newConfig = { ...gradientConfig, ...updates };
    setGradientConfig(newConfig);

    const gradientString = buildGradient(newConfig);
    onChange({
      backgroundType: "gradient",
      backgroundColor,
      backgroundGradient: gradientString,
      backgroundImage,
    });
  };

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    onChange({
      backgroundType: "image",
      backgroundColor,
      backgroundGradient,
      backgroundImage: url,
    });
  };

  // Handle image opacity change
  const handleImageOpacityChange = (opacity: number) => {
    setImageOpacity(opacity);
  };

  return (
    <div className="space-y-4">
      <Tabs value={backgroundType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solid">Solid</TabsTrigger>
          <TabsTrigger value="gradient">Gradient</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>

        <TabsContent value="solid" className="space-y-4">
          <ColorPicker
            label="Background Color"
            value={backgroundColor}
            onChange={handleSolidColorChange}
          />

          {/* Preview */}
          <Card>
            <CardContent className="p-4">
              <Label className="mb-2 block">Preview</Label>
              <div
                className="h-32 w-full rounded-md border"
                style={{ backgroundColor }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gradient" className="space-y-4">
          <div className="space-y-4">
            <ColorPicker
              label="Start Color"
              value={gradientConfig.startColor}
              onChange={(color) =>
                handleGradientChange({ startColor: color })
              }
            />

            <ColorPicker
              label="End Color"
              value={gradientConfig.endColor}
              onChange={(color) =>
                handleGradientChange({ endColor: color })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="gradient-direction">Direction</Label>
              <Select
                value={gradientConfig.direction}
                onValueChange={(value) =>
                  handleGradientChange({
                    direction: value as GradientDirection,
                  })
                }
              >
                <SelectTrigger id="gradient-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">
                    Vertical (Top to Bottom)
                  </SelectItem>
                  <SelectItem value="horizontal">
                    Horizontal (Left to Right)
                  </SelectItem>
                  <SelectItem value="diagonal">
                    Diagonal (Top-Left to Bottom-Right)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <Card>
              <CardContent className="p-4">
                <Label className="mb-2 block">Preview</Label>
                <div
                  className="h-32 w-full rounded-md border"
                  style={{
                    background: buildGradient(gradientConfig),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to an image (JPEG, PNG, GIF, WebP)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-opacity">
              Overlay Opacity: {imageOpacity}%
            </Label>
            <input
              id="image-opacity"
              type="range"
              min="0"
              max="100"
              value={imageOpacity}
              onChange={(e) =>
                handleImageOpacityChange(Number(e.target.value))
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Add a dark overlay to improve text readability
            </p>
          </div>

          {/* Preview */}
          <Card>
            <CardContent className="p-4">
              <Label className="mb-2 block">Preview</Label>
              <div className="relative h-32 w-full overflow-hidden rounded-md border">
                {imageUrl ? (
                  <>
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                      }}
                    />
                    {imageOpacity < 100 && (
                      <div
                        className="absolute inset-0 bg-black"
                        style={{
                          opacity: (100 - imageOpacity) / 100,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Enter an image URL to see preview
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
