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
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Button, Card, CardContent, cn } from "@pingtome/ui";

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
        "mb-2 transition-opacity",
        isDragging && "opacity-50 z-50"
      )}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
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

            {/* Link Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{link.title}</h4>
                {link.externalUrl && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {truncatedUrl}
              </p>
              {link.description && (
                <p className="text-xs text-muted-foreground/80 truncate mt-1">
                  {link.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Visibility Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(link.id)}
                title={link.isVisible ? "Hide link" : "Show link"}
                className="h-8 w-8 p-0"
              >
                {link.isVisible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>

              {/* Edit Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(link)}
                title="Edit link"
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(link.id)}
                title="Delete link"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </Button>
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
    })
  );

  /**
   * Handle drag end event and reorder links
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedLinks.findIndex((link) => link.id === active.id);
    const newIndex = sortedLinks.findIndex((link) => link.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
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
  };

  // Empty state
  if (links.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <ExternalLink className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No links yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Add your first link to get started. Links will appear here and can be
          reordered by dragging.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
    </DndContext>
  );
}
