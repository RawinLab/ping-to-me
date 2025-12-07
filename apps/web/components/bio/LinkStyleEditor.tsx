"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
} from "@pingtome/ui";
import { ColorPicker } from "@/components/bio/ColorPicker";
import {
  ExternalLink,
  Paintbrush,
  Type,
  FileText,
  Eye,
  Info,
  X,
  Check,
  ArrowLeftRight,
  ImageIcon,
} from "lucide-react";

/**
 * Interface for BioPageLink representing a link in a bio page
 */
export interface BioPageLink {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  icon: string | null;
  thumbnailUrl: string | null;
  buttonColor: string | null;
  textColor: string | null;
  order: number;
  isVisible: boolean;
  link: {
    slug: string;
    originalUrl: string;
  } | null;
}

interface LinkStyleEditorProps {
  link: BioPageLink | null;
  onSave: (updates: Partial<BioPageLink>) => void;
  onClose: () => void;
  open: boolean;
}

/**
 * LinkStyleEditor component for customizing individual link appearance
 * Provides a modal interface to edit link title, description, thumbnail, and colors
 * Includes a live preview of how the link will appear
 */
export function LinkStyleEditor({
  link,
  onSave,
  onClose,
  open,
}: LinkStyleEditorProps) {
  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [buttonColor, setButtonColor] = React.useState("#3B82F6");
  const [textColor, setTextColor] = React.useState("#FFFFFF");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form when link changes or dialog opens
  React.useEffect(() => {
    if (link && open) {
      setTitle(link.title || "");
      setDescription(link.description || "");
      setThumbnailUrl(link.thumbnailUrl || "");
      setButtonColor(link.buttonColor || "#3B82F6");
      setTextColor(link.textColor || "#FFFFFF");
      setErrors({});
    }
  }, [link, open]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updates: Partial<BioPageLink> = {
      title,
      description: description.trim() || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      buttonColor,
      textColor,
    };

    onSave(updates);
    onClose();
  };

  // Handle cancel/close
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // Get display URL for preview
  const getDisplayUrl = (): string => {
    if (!link) return "";
    if (link.externalUrl) {
      return link.externalUrl;
    }
    if (link.link) {
      return link.link.originalUrl;
    }
    return "";
  };

  // Truncate URL for subtitle display
  const getTruncatedUrl = (url: string, maxLength = 50): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  // Swap button and text colors
  const handleSwapColors = () => {
    const temp = buttonColor;
    setButtonColor(textColor);
    setTextColor(temp);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Paintbrush className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Customize Link Style
              </DialogTitle>
              {link && getDisplayUrl() && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {getTruncatedUrl(getDisplayUrl())}
                </p>
              )}
            </div>
          </div>
          <DialogDescription>
            Customize the appearance of this link. Changes will be reflected in
            the preview below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Form Fields */}
          <div className="space-y-6">
            {/* Content Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Content
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter link title"
                  className={`transition-all ${
                    errors.title
                      ? "border-red-500 focus:ring-red-500"
                      : "focus:ring-2 focus:ring-primary/20"
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for the link"
                  rows={3}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Displayed below the title.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="thumbnailUrl"
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Thumbnail URL
                </Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. URL to an image to display with the link.
                </p>
              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Colors
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapColors}
                  className="h-7 px-2 text-xs"
                >
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  Swap
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Button Color"
                  value={buttonColor}
                  onChange={setButtonColor}
                />

                <ColorPicker
                  label="Text Color"
                  value={textColor}
                  onChange={setTextColor}
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label className="mb-0 font-semibold">Live Preview</Label>
            </div>

            {/* Phone frame with preview */}
            <div className="relative">
              {/* Phone frame outline */}
              <div className="border-4 border-gray-300 rounded-3xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl">
                {/* Notch (optional decorative element) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-300 rounded-full"></div>

                {/* Grid background pattern */}
                <div
                  className="rounded-xl p-6 relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {/* Preview card */}
                  <Card
                    className="hover:scale-[1.02] transition-all cursor-pointer border-0 shadow-lg"
                    style={{
                      backgroundColor: buttonColor,
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Thumbnail if provided */}
                        {thumbnailUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={thumbnailUrl}
                              alt={title || "Link thumbnail"}
                              className="h-12 w-12 rounded object-cover"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-lg"
                            style={{
                              color: textColor,
                            }}
                          >
                            {title || "Link Title"}
                          </div>
                          {description && (
                            <div
                              className="text-sm mt-1 line-clamp-2"
                              style={{
                                color: textColor,
                                opacity: 0.8,
                              }}
                            >
                              {description}
                            </div>
                          )}
                          {!description && getDisplayUrl() && (
                            <div
                              className="text-sm mt-1 truncate"
                              style={{
                                color: textColor,
                                opacity: 0.7,
                              }}
                            >
                              {getDisplayUrl()}
                            </div>
                          )}
                        </div>

                        {/* External link icon */}
                        <ExternalLink
                          className="h-5 w-5 flex-shrink-0"
                          style={{
                            color: textColor,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Tips card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-900">
                      Design Tips
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Use contrasting colors for better readability
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Keep titles concise and descriptive</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Thumbnail images work best at square aspect ratios
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
