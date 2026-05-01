"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  Mail,
  MessageCircle,
  GripVertical,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@pingtome/ui";
import type { SocialPlatform, SocialLink } from "@pingtome/types";
import { useTranslations } from "next-intl";

/**
 * Props for the SocialLinksEditor component
 */
interface SocialLinksEditorProps {
  socialLinks: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

/**
 * Props for individual sortable social link items
 */
interface SortableSocialLinkItemProps {
  link: SocialLink;
  onDelete: (index: number) => void;
  index: number;
}

/**
 * Platform metadata for display and validation
 */
interface PlatformMetadata {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  urlPatterns: RegExp[];
  placeholder: string;
}

/**
 * Platform configuration with icons and validation patterns
 */
const PLATFORM_CONFIG: Record<SocialPlatform, PlatformMetadata> = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    urlPatterns: [/instagram\.com\//i],
    placeholder: "https://instagram.com/username",
  },
  twitter: {
    label: "Twitter / X",
    icon: Twitter,
    urlPatterns: [/twitter\.com\//i, /x\.com\//i],
    placeholder: "https://twitter.com/username",
  },
  tiktok: {
    label: "TikTok",
    icon: MessageCircle,
    urlPatterns: [/tiktok\.com\//i],
    placeholder: "https://tiktok.com/@username",
  },
  youtube: {
    label: "YouTube",
    icon: Youtube,
    urlPatterns: [/youtube\.com\//i, /youtu\.be\//i],
    placeholder: "https://youtube.com/@username",
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    urlPatterns: [/facebook\.com\//i, /fb\.com\//i],
    placeholder: "https://facebook.com/username",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    urlPatterns: [/linkedin\.com\//i],
    placeholder: "https://linkedin.com/in/username",
  },
  github: {
    label: "GitHub",
    icon: Github,
    urlPatterns: [/github\.com\//i],
    placeholder: "https://github.com/username",
  },
  email: {
    label: "Email",
    icon: Mail,
    urlPatterns: [/^mailto:/i],
    placeholder: "mailto:email@example.com",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    urlPatterns: [/wa\.me\//i, /whatsapp\.com\//i],
    placeholder: "https://wa.me/1234567890",
  },
};

/**
 * Auto-detect platform from URL
 */
function detectPlatformFromUrl(url: string): SocialPlatform | null {
  const normalizedUrl = url.toLowerCase().trim();

  // Check each platform's patterns
  for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
    for (const pattern of config.urlPatterns) {
      if (pattern.test(normalizedUrl)) {
        return platform as SocialPlatform;
      }
    }
  }

  return null;
}

/**
 * Validate URL matches the selected platform
 */
function validatePlatformUrl(
  platform: SocialPlatform,
  url: string,
  t: (key: string, params?: Record<string, string>) => string,
): { valid: boolean; error?: string } {
  const config = PLATFORM_CONFIG[platform];
  const normalizedUrl = url.toLowerCase().trim();

  if (!normalizedUrl) {
    return { valid: false, error: t("urlRequired") };
  }

  if (platform === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normalizedUrl.startsWith("mailto:")) {
      return { valid: true };
    } else if (emailRegex.test(normalizedUrl)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: t("emailFormat"),
    };
  }

  const matches = config.urlPatterns.some((pattern) =>
    pattern.test(normalizedUrl),
  );

  if (!matches) {
    return {
      valid: false,
      error: t("urlNotMatchFormat", { label: config.label }),
    };
  }

  return { valid: true };
}

/**
 * Normalize URL for email platform
 */
function normalizeUrl(platform: SocialPlatform, url: string): string {
  if (platform === "email" && !url.startsWith("mailto:")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(url)) {
      return `mailto:${url}`;
    }
  }
  return url;
}

/**
 * SortableSocialLinkItem - Individual draggable social link card
 */
function SortableSocialLinkItem({
  link,
  onDelete,
  index,
}: SortableSocialLinkItemProps) {
  const t = useTranslations("bio");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `social-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = PLATFORM_CONFIG[link.platform];
  const Icon = config.icon;

  // Display URL (remove mailto: prefix for cleaner display)
  const displayUrl =
    link.platform === "email" && link.url.startsWith("mailto:")
      ? link.url.substring(7)
      : link.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("mb-2 transition-opacity", isDragging && "opacity-50 z-50")}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>

            {/* Platform Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>

            {/* Link Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{config.label}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {displayUrl}
              </p>
            </div>

            {/* Delete Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(index)}
              title={t("deleteSocialLink")}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SocialLinksEditor - Main component for managing social media links
 *
 * Features:
 * - Add social links with platform detection
 * - Drag and drop reordering with smooth animations
 * - Platform-specific URL validation
 * - Auto-detect platform from URL
 * - Visual platform icons
 * - Delete individual links
 */
export function SocialLinksEditor({
  socialLinks,
  onChange,
}: SocialLinksEditorProps) {
  const t = useTranslations("bio");

  // Form state for new link
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<SocialPlatform>("instagram");
  const [url, setUrl] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [isAddingLink, setIsAddingLink] = React.useState(false);

  // Sort links by order property
  const sortedLinks = React.useMemo(() => {
    return [...socialLinks].sort((a, b) => a.order - b.order);
  }, [socialLinks]);

  // Configure sensors for drag operations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * Handle drag end event and reorder links
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedLinks.findIndex(
      (_, idx) => `social-${idx}` === active.id,
    );
    const newIndex = sortedLinks.findIndex(
      (_, idx) => `social-${idx}` === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the links array
    const reorderedLinks = arrayMove(sortedLinks, oldIndex, newIndex);

    // Update order property for all links
    const updatedLinks = reorderedLinks.map((link, index) => ({
      ...link,
      order: index,
    }));

    onChange(updatedLinks);
  };

  /**
   * Handle URL input change with auto-detection
   */
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(null);

    // Auto-detect platform from URL
    const detectedPlatform = detectPlatformFromUrl(value);
    if (detectedPlatform) {
      setSelectedPlatform(detectedPlatform);
    }
  };

  /**
   * Add new social link
   */
  const handleAddLink = () => {
    // Normalize URL
    const normalizedUrl = normalizeUrl(selectedPlatform, url.trim());

    // Validate URL
    const validation = validatePlatformUrl(selectedPlatform, normalizedUrl, t);
    if (!validation.valid) {
      setUrlError(validation.error ?? null);
      return;
    }

    // Check for duplicates
    const isDuplicate = socialLinks.some(
      (link) =>
        link.platform === selectedPlatform ||
        link.url.toLowerCase() === normalizedUrl.toLowerCase(),
    );

    if (isDuplicate) {
      setUrlError(t("linkAlreadyExists", { label: PLATFORM_CONFIG[selectedPlatform].label }));
      return;
    }

    // Create new link
    const newLink: SocialLink = {
      platform: selectedPlatform,
      url: normalizedUrl,
      order: socialLinks.length,
    };

    // Add to links array
    onChange([...socialLinks, newLink]);

    // Reset form
    setUrl("");
    setUrlError(null);
    setIsAddingLink(false);
  };

  /**
   * Delete a social link
   */
  const handleDeleteLink = (index: number) => {
    const updatedLinks = sortedLinks
      .filter((_, idx) => idx !== index)
      .map((link, idx) => ({ ...link, order: idx }));

    onChange(updatedLinks);
  };

  /**
   * Cancel adding new link
   */
  const handleCancelAdd = () => {
    setUrl("");
    setUrlError(null);
    setIsAddingLink(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("socialLinks")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("addSocialProfiles")}
          </p>
        </div>
        {!isAddingLink && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingLink(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("addLink")}
          </Button>
        )}
      </div>

      {/* Add New Link Form */}
      {isAddingLink && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">{t("platform")}</Label>
              <Select
                value={selectedPlatform}
                onValueChange={(value) =>
                  setSelectedPlatform(value as SocialPlatform)
                }
              >
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={platform} value={platform}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">{t("url")}</Label>
              <Input
                id="url"
                type="text"
                placeholder={PLATFORM_CONFIG[selectedPlatform].placeholder}
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={cn(urlError && "border-red-500")}
              />
              {urlError && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{urlError}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("pasteUrlAutoDetect")}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleAddLink}>
                {t("addLink")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links List */}
      {sortedLinks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedLinks.map((_, idx) => `social-${idx}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0">
              {sortedLinks.map((link, index) => (
                <SortableSocialLinkItem
                  key={`social-${index}`}
                  link={link}
                  index={index}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        !isAddingLink && (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-medium mb-1">{t("noSocialLinksYet")}</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t("addSocialProfilesDescription")}
            </p>
          </div>
        )
      )}
    </div>
  );
}
