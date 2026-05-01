"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pingtome/ui";

/**
 * BioPageLink type definition
 */
interface BioPageLink {
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

/**
 * Props for the SortableLinkList component
 */
interface SortableLinkListProps {
  links: BioPageLink[];
  onReorder: (orderings: { id: string; order: number }[]) => void;
  onEdit: (link: BioPageLink) => void;
  onDelete: (linkId: string) => void;
  onToggleVisibility: (linkId: string) => void;
}

/**
 * Props for individual sortable link items
 */
interface SortableLinkItemProps {
  link: BioPageLink;
  onEdit: (link: BioPageLink) => void;
  onDelete: (linkId: string) => void;
  onToggleVisibility: (linkId: string) => void;
}

/**
 * SortableLinkItem - Individual draggable link card
 */
function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onToggleVisibility,
}: SortableLinkItemProps) {
  const t = useTranslations("bio");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get the URL to display (external URL or link's original URL)
  const displayUrl = link.externalUrl || link.link?.originalUrl || "";
  const truncatedUrl =
    displayUrl.length > 50 ? `${displayUrl.substring(0, 50)}...` : displayUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-3 transition-all duration-200",
        isDragging && "opacity-40 scale-105 z-50",
      )}
    >
      <Card
        className={cn(
          "group relative overflow-hidden",
          "border-l-4 border-l-transparent",
          "hover:border-l-primary hover:shadow-lg",
          "transition-all duration-200 ease-in-out",
          "bg-gradient-to-br from-card to-card/50",
          isDragging && "shadow-2xl ring-2 ring-primary/20",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "cursor-grab active:cursor-grabbing touch-none",
                      "rounded-md p-1.5 -ml-1.5 transition-all duration-200",
                      "hover:bg-muted/80 active:bg-primary/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    )}
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical
                      className={cn(
                        "h-5 w-5 text-muted-foreground/60",
                        "group-hover:text-muted-foreground transition-colors duration-200",
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{t("dragToReorder")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Link Icon/Favicon Preview */}
            <div
              className={cn(
                "flex items-center justify-center",
                "h-10 w-10 rounded-lg shrink-0",
                "bg-gradient-to-br from-primary/10 to-primary/5",
                "border border-primary/20",
                "transition-all duration-200",
                "group-hover:scale-110 group-hover:border-primary/40",
              )}
            >
              {link.icon ? (
                <span className="text-xl">{link.icon}</span>
              ) : (
                <Link2 className="h-5 w-5 text-primary/70" />
              )}
            </div>

            {/* Link Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {link.title}
                </h4>
                {link.externalUrl && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground/80 truncate mt-0.5 font-mono">
                {truncatedUrl}
              </p>
              {link.description && (
                <p className="text-xs text-muted-foreground/70 truncate mt-1.5 line-clamp-1">
                  {link.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5">
              <TooltipProvider delayDuration={300}>
                {/* Visibility Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleVisibility(link.id)}
                      className={cn(
                        "h-8 w-8 p-0 transition-all duration-200",
                        "hover:scale-110 hover:bg-muted/80",
                        link.isVisible
                          ? "hover:text-green-600"
                          : "hover:text-yellow-600",
                      )}
                    >
                      {link.isVisible ? (
                        <Eye className="h-4 w-4 text-green-600/70" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-yellow-600/70" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.isVisible ? t("hideLink") : t("showLink")}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Edit Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(link)}
                      className={cn(
                        "h-8 w-8 p-0 transition-all duration-200",
                        "hover:scale-110 hover:bg-blue-50 hover:text-blue-600",
                        "dark:hover:bg-blue-950/50",
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("editLink")}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Delete Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(link.id)}
                      className={cn(
                        "h-8 w-8 p-0 transition-all duration-200",
                        "hover:scale-110 hover:bg-red-50 hover:text-red-600",
                        "dark:hover:bg-red-950/50",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("deleteLink")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SortableLinkList - Main component for drag-and-drop sortable bio page links
 *
 * Features:
 * - Drag and drop reordering with smooth animations
 * - Individual link cards with drag handle
 * - Edit, delete, and visibility toggle actions
 * - Empty state with helpful message
 * - Keyboard and pointer sensor support
 */
export function SortableLinkList({
  links,
  onReorder,
  onEdit,
  onDelete,
  onToggleVisibility,
}: SortableLinkListProps) {
  const t = useTranslations("bio");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Sort links by order property
  const sortedLinks = React.useMemo(() => {
    return [...links].sort((a, b) => a.order - b.order);
  }, [links]);

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
   * Handle drag start event
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Handle drag end event and reorder links
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = sortedLinks.findIndex((link) => link.id === active.id);
    const newIndex = sortedLinks.findIndex((link) => link.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null);
      return;
    }

    // Reorder the links array
    const reorderedLinks = arrayMove(sortedLinks, oldIndex, newIndex);

    // Create orderings array with updated positions
    const orderings = reorderedLinks.map((link, index) => ({
      id: link.id,
      order: index,
    }));

    onReorder(orderings);
    setActiveId(null);
  };

  // Find the active link for drag overlay
  const activeLink = sortedLinks.find((link) => link.id === activeId);

  // Empty state
  if (links.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div
          className={cn(
            "inline-flex items-center justify-center",
            "w-20 h-20 rounded-2xl mb-6",
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
            "border-2 border-dashed border-primary/20",
            "animate-in fade-in-0 zoom-in-95 duration-500",
          )}
        >
          <Link2
            className={cn(
              "h-10 w-10 text-primary/60",
              "animate-in fade-in-0 zoom-in-50 duration-700 delay-150",
            )}
          />
        </div>
        <h3
          className={cn(
            "text-lg font-semibold mb-2 text-foreground/90",
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200",
          )}
        >
          {t("noLinksYet")}
        </h3>
        <p
          className={cn(
            "text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed",
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300",
          )}
        >
          {t("addFirstLink")}
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedLinks.map((link) => link.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0">
          {sortedLinks.map((link) => (
            <SortableLinkItem
              key={link.id}
              link={link}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows a copy of the dragged item */}
      <DragOverlay dropAnimation={null}>
        {activeLink ? (
          <Card
            className={cn(
              "shadow-2xl rotate-3 scale-105",
              "border-l-4 border-l-primary",
              "bg-gradient-to-br from-card to-card/50",
              "opacity-90",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center",
                    "h-10 w-10 rounded-lg shrink-0",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "border border-primary/20",
                  )}
                >
                  {activeLink.icon ? (
                    <span className="text-xl">{activeLink.icon}</span>
                  ) : (
                    <Link2 className="h-5 w-5 text-primary/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {activeLink.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeLink.externalUrl ||
                      activeLink.link?.originalUrl ||
                      ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
