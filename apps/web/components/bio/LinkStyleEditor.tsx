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
import { ExternalLink } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Link Style</DialogTitle>
          <DialogDescription>
            Customize the appearance of this link. Changes will be reflected in
            the preview below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter link title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for the link"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Displayed below the title.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Optional. URL to an image to display with the link.
              </p>
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

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border-2 border-dashed rounded-lg p-6 bg-gray-50">
              <p className="text-xs text-muted-foreground mb-4 text-center">
                Live Preview
              </p>
              <Card
                className="hover:scale-[1.02] transition-all cursor-pointer border-0 shadow-md"
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

            <div className="text-xs text-muted-foreground mt-4 space-y-1">
              <p className="font-semibold">Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use contrasting colors for better readability</li>
                <li>Keep titles concise and descriptive</li>
                <li>Thumbnail images work best at square aspect ratios</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
