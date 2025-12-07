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
  Button,
} from "@pingtome/ui";
import { ColorPicker } from "@/components/bio/ColorPicker";
import { cn } from "@pingtome/ui";
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Eye,
  ArrowDown,
  ArrowRight,
  ArrowDownRight,
} from "lucide-react";

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

interface GradientPreset {
  name: string;
  startColor: string;
  endColor: string;
  direction: GradientDirection;
}

const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "Purple Dream",
    startColor: "#667eea",
    endColor: "#764ba2",
    direction: "diagonal",
  },
  {
    name: "Ocean Blue",
    startColor: "#2E3192",
    endColor: "#1BFFFF",
    direction: "diagonal",
  },
  {
    name: "Sunset",
    startColor: "#FF6B6B",
    endColor: "#FFE66D",
    direction: "horizontal",
  },
  {
    name: "Forest",
    startColor: "#134E5E",
    endColor: "#71B280",
    direction: "vertical",
  },
  {
    name: "Rose Gold",
    startColor: "#ED4264",
    endColor: "#FFEDBC",
    direction: "diagonal",
  },
  {
    name: "Northern Lights",
    startColor: "#00C9FF",
    endColor: "#92FE9D",
    direction: "vertical",
  },
];

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
  const [imageError, setImageError] = React.useState(false);

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

  // Handle preset gradient selection
  const handlePresetSelect = (preset: GradientPreset) => {
    const newConfig: GradientConfig = {
      startColor: preset.startColor,
      endColor: preset.endColor,
      direction: preset.direction,
    };
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
    setImageError(false);
    onChange({
      backgroundType: "image",
      backgroundColor,
      backgroundGradient,
      backgroundImage: url,
    });
  };

  // Validate image URL
  const validateImageUrl = (url: string) => {
    if (!url) {
      setImageError(false);
      return;
    }
    const img = new Image();
    img.onload = () => setImageError(false);
    img.onerror = () => setImageError(true);
    img.src = url;
  };

  React.useEffect(() => {
    if (imageUrl) {
      const timeout = setTimeout(() => validateImageUrl(imageUrl), 500);
      return () => clearTimeout(timeout);
    }
  }, [imageUrl]);

  // Handle image opacity change
  const handleImageOpacityChange = (opacity: number) => {
    setImageOpacity(opacity);
  };

  return (
    <div className="space-y-6">
      <Tabs value={backgroundType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solid" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Solid</span>
          </TabsTrigger>
          <TabsTrigger value="gradient" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Gradient</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solid" className="space-y-6 mt-6">
          <ColorPicker
            label="Background Color"
            value={backgroundColor}
            onChange={handleSolidColorChange}
          />

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label>Preview</Label>
            </div>
            <Card className="shadow-sm border-2 transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div
                  className="h-40 w-full rounded-lg border transition-all duration-300"
                  style={{ backgroundColor }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gradient" className="space-y-6 mt-6">
          <div className="space-y-6">
            {/* Gradient Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preset Gradients</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border-2 transition-all duration-200",
                      "hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      gradientConfig.startColor === preset.startColor &&
                        gradientConfig.endColor === preset.endColor
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    )}
                  >
                    <div
                      className="h-20 w-full transition-transform duration-200 group-hover:scale-110"
                      style={{
                        background: buildGradient({
                          startColor: preset.startColor,
                          endColor: preset.endColor,
                          direction: preset.direction,
                        }),
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-xs font-medium text-white px-2 text-center">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Gradient Controls */}
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-sm font-medium">Custom Gradient</Label>

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

              <div className="space-y-3">
                <Label htmlFor="gradient-direction" className="text-sm font-medium">
                  Direction
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleGradientChange({ direction: "vertical" })
                    }
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                      "hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      gradientConfig.direction === "vertical"
                        ? "border-primary bg-accent"
                        : "border-border"
                    )}
                  >
                    <ArrowDown className="h-5 w-5" />
                    <span className="text-xs font-medium">Vertical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleGradientChange({ direction: "horizontal" })
                    }
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                      "hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      gradientConfig.direction === "horizontal"
                        ? "border-primary bg-accent"
                        : "border-border"
                    )}
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span className="text-xs font-medium">Horizontal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleGradientChange({ direction: "diagonal" })
                    }
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                      "hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      gradientConfig.direction === "diagonal"
                        ? "border-primary bg-accent"
                        : "border-border"
                    )}
                  >
                    <ArrowDownRight className="h-5 w-5" />
                    <span className="text-xs font-medium">Diagonal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label>Preview</Label>
              </div>
              <Card className="shadow-sm border-2 transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div
                    className="h-40 w-full rounded-lg border transition-all duration-300"
                    style={{
                      background: buildGradient(gradientConfig),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-6 mt-6">
          <div className="space-y-6">
            {/* Image URL Input */}
            <div className="space-y-3">
              <Label htmlFor="image-url" className="text-sm font-medium">
                Image URL
              </Label>
              <div className="space-y-2">
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className={cn(
                    "transition-all",
                    imageError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {imageError ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    Failed to load image. Please check the URL.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image (JPEG, PNG, GIF, WebP)
                  </p>
                )}
              </div>
            </div>

            {/* Image Opacity Slider */}
            <div className="space-y-3">
              <Label htmlFor="image-opacity" className="text-sm font-medium">
                Overlay Opacity
              </Label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      id="image-opacity"
                      type="range"
                      min="0"
                      max="100"
                      value={imageOpacity}
                      onChange={(e) =>
                        handleImageOpacityChange(Number(e.target.value))
                      }
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${imageOpacity}%, hsl(var(--secondary)) ${imageOpacity}%, hsl(var(--secondary)) 100%)`,
                      }}
                    />
                  </div>
                  <div className="min-w-[4rem] text-right">
                    <span className="text-sm font-medium tabular-nums">
                      {imageOpacity}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add a dark overlay to improve text readability (0% = fully visible, 100% = no overlay)
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label>Preview</Label>
              </div>
              <Card className="shadow-sm border-2 transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="relative h-40 w-full overflow-hidden rounded-lg border transition-all duration-300">
                    {imageUrl && !imageError ? (
                      <>
                        <div
                          className="h-full w-full bg-cover bg-center transition-all duration-300"
                          style={{
                            backgroundImage: `url(${imageUrl})`,
                          }}
                        />
                        {imageOpacity < 100 && (
                          <div
                            className="absolute inset-0 bg-black transition-opacity duration-300"
                            style={{
                              opacity: (100 - imageOpacity) / 100,
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center space-y-2 p-4">
                          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            {imageError
                              ? "Unable to load image"
                              : "Enter an image URL to see preview"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
