"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import {
  Plus,
  Folder,
  Trash2,
  FolderOpen,
  Link2,
  ExternalLink,
  Palette,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FolderPlus,
  Edit,
  Move,
  FolderTree,
} from "lucide-react";
import Link from "next/link";

interface FolderData {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  _count: {
    links: number;
  };
  children?: FolderData[];
}

const PRESET_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
];

// Recursive component to render folder tree
function FolderTreeItem({
  folder,
  depth = 0,
  onCreateSubfolder,
  onDelete,
  onMove,
  onEdit,
  allFolders,
}: {
  folder: FolderData;
  depth?: number;
  onCreateSubfolder: (parentId: string) => void;
  onDelete: (id: string) => void;
  onMove: (folder: FolderData) => void;
  onEdit: (folder: FolderData) => void;
  allFolders: FolderData[];
}) {
  const t = useTranslations("folders");
  const [isOpen, setIsOpen] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = folder.children && folder.children.length > 0;
  const totalLinks = getTotalLinks(folder);

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-all duration-200"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Color indicator */}
          <div
            className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
            style={{ backgroundColor: folder.color || "#3b82f6" }}
          />

          {/* Expand/collapse button */}
          <div className="flex items-center pl-2">
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-slate-200"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  )}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <div className="h-6 w-6" />
            )}
          </div>

          {/* Folder icon */}
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${folder.color || "#3b82f6"}20`,
            }}
          >
            {isOpen && hasChildren ? (
              <FolderOpen
                className="h-5 w-5"
                style={{ color: folder.color || "#3b82f6" }}
              />
            ) : (
              <Folder
                className="h-5 w-5"
                style={{ color: folder.color || "#3b82f6" }}
              />
            )}
          </div>

          {/* Folder info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {folder.name}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {folder._count.links} {t("direct")}
              </span>
              {hasChildren && (
                <span className="flex items-center gap-1">
                  <FolderTree className="h-3 w-3" />
                  {totalLinks} {t("total")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/links?folder=${folder.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs hover:bg-slate-200"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {t("viewLinks")}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(folder)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("editFolder")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  {t("createSubfolder")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMove(folder)}>
                  <Move className="mr-2 h-4 w-4" />
                  {t("moveFolder")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(folder.id)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteFolder")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent className="mt-2 space-y-2">
            {folder.children!.map((child) => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                depth={depth + 1}
                onCreateSubfolder={onCreateSubfolder}
                onDelete={onDelete}
                onMove={onMove}
                onEdit={onEdit}
                allFolders={allFolders}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

// Helper to calculate total links including children
function getTotalLinks(folder: FolderData): number {
  let total = folder._count.links;
  if (folder.children) {
    folder.children.forEach((child) => {
      total += getTotalLinks(child);
    });
  }
  return total;
}

// Helper to count total folders including children
function getTotalFolders(folders: FolderData[]): number {
  let total = folders.length;
  folders.forEach((folder) => {
    if (folder.children) {
      total += getTotalFolders(folder.children);
    }
  });
  return total;
}

// Helper to flatten folder tree for select options
function flattenFolders(
  folders: FolderData[],
  depth = 0,
  excludeId?: string
): Array<{ id: string; name: string; depth: number }> {
  const result: Array<{ id: string; name: string; depth: number }> = [];

  folders.forEach((folder) => {
    // Exclude the folder being moved and its descendants
    if (folder.id !== excludeId) {
      result.push({ id: folder.id, name: folder.name, depth });
      if (folder.children) {
        result.push(...flattenFolders(folder.children, depth + 1, excludeId));
      }
    }
  });

  return result;
}

export default function FoldersPage() {
  const t = useTranslations("folders");
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);
  const [movingFolder, setMovingFolder] = useState<FolderData | null>(null);
  const [moveTargetParentId, setMoveTargetParentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      // Fetch tree structure from API
      const res = await apiRequest("/folders/tree");
      setFolders(res);
    } catch (error) {
      console.error("Failed to fetch folders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;

    try {
      await apiRequest("/folders", {
        method: "POST",
        body: JSON.stringify({
          name: newFolderName,
          color: newFolderColor,
          parentId: selectedParentId,
        }),
      });
      setNewFolderName("");
      setNewFolderColor("#3b82f6");
      setSelectedParentId(null);
      setCreateDialogOpen(false);
      fetchFolders();
    } catch (error) {
      alert(t("failedToCreateFolder"));
    }
  };

  const handleEdit = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      await apiRequest(`/folders/${editingFolder.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: newFolderName,
          color: newFolderColor,
        }),
      });
      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderColor("#3b82f6");
      setEditDialogOpen(false);
      fetchFolders();
    } catch (error) {
      alert(t("failedToUpdateFolder"));
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(t("deleteFolderConfirm"))
    )
      return;

    try {
      await apiRequest(`/folders/${id}`, { method: "DELETE" });
      fetchFolders();
    } catch (error) {
      alert(t("failedToDeleteFolder"));
    }
  };

  const handleMoveFolder = (folder: FolderData) => {
    setMovingFolder(folder);
    setMoveTargetParentId(folder.parentId || null);
    setMoveDialogOpen(true);
  };

  const handleMoveConfirm = async () => {
    if (!movingFolder) return;

    try {
      await apiRequest(`/folders/${movingFolder.id}/move`, {
        method: "POST",
        body: JSON.stringify({ parentId: moveTargetParentId }),
      });
      setMoveDialogOpen(false);
      setMovingFolder(null);
      setMoveTargetParentId(null);
      fetchFolders();
    } catch (error) {
      alert(t("failedToMoveFolder"));
    }
  };

  const handleCreateSubfolder = (parentId: string) => {
    setSelectedParentId(parentId);
    setCreateDialogOpen(true);
  };

  const handleEditFolder = (folder: FolderData) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color || "#3b82f6");
    setEditDialogOpen(true);
  };

  const totalFolderCount = getTotalFolders(folders);
  const totalLinks = folders.reduce((sum, f) => sum + getTotalLinks(f), 0);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
      </div>
    );
  }

  const availableFolders = movingFolder
    ? flattenFolders(folders, 0, movingFolder.id)
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedParentId(null);
              setCreateDialogOpen(true);
            }}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("newFolder")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {totalFolderCount}
                  </p>
                  <p className="text-sm text-blue-600">{t("totalFolders")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {totalLinks}
                  </p>
                  <p className="text-sm text-emerald-600">{t("linksOrganized")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folder Tree */}
        {folders.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("noFoldersYet")}
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {t("createFirstFolder")}
                </p>
                <Button
                  onClick={() => {
                    setSelectedParentId(null);
                    setCreateDialogOpen(true);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                >
                  <Plus className="mr-2 h-4 w-4" /> {t("createYourFirstFolder")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {folders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                onCreateSubfolder={handleCreateSubfolder}
                onDelete={handleDelete}
                onMove={handleMoveFolder}
                onEdit={handleEditFolder}
                allFolders={folders}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog
          open={createDialogOpen || editDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
              setEditingFolder(null);
              setNewFolderName("");
              setNewFolderColor("#3b82f6");
              setSelectedParentId(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-600" />
                {editingFolder ? t("editFolder") : t("createFolder")}
              </DialogTitle>
              <DialogDescription>
                {editingFolder
                  ? t("editFolderDescription")
                  : selectedParentId
                  ? t("createSubfolderDescription")
                  : t("createFolderDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  {t("folderName")}
                </Label>
                <Input
                  id="name"
                  placeholder={t("folderNamePlaceholder")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t("folderColor")}
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewFolderColor(color.value)}
                      className={`h-10 w-full rounded-lg transition-all ${
                        newFolderColor === color.value
                          ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="flex-1 h-10 rounded-lg font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setEditingFolder(null);
                  setNewFolderName("");
                  setNewFolderColor("#3b82f6");
                  setSelectedParentId(null);
                }}
                className="rounded-lg"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={editingFolder ? handleEdit : handleCreate}
                disabled={!newFolderName.trim()}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {editingFolder ? t("updateFolder") : t("createFolder")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move Folder Dialog */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Move className="h-5 w-5 text-blue-600" />
                {t("moveFolderTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("moveFolderDescription")} &quot;{movingFolder?.name}&quot;{t("moveFolderEmptyRoot")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  {t("parentFolder")}
                </Label>
                <Select
                  value={moveTargetParentId || "root"}
                  onValueChange={(value) =>
                    setMoveTargetParentId(value === "root" ? null : value)
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder={t("selectParentFolder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-slate-500" />
                        <span>{t("rootNoParent")}</span>
                      </div>
                    </SelectItem>
                    {availableFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${folder.depth * 16}px` }}
                        >
                          <Folder className="h-4 w-4 text-slate-500" />
                          <span>{folder.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMoveDialogOpen(false);
                  setMovingFolder(null);
                  setMoveTargetParentId(null);
                }}
                className="rounded-lg"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleMoveConfirm}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {t("moveFolder")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
