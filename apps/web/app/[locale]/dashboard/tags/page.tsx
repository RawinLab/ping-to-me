"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiRequest, getCurrentOrganizationId } from "@/lib/api";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import {
  Plus,
  Tag,
  Tags as TagsIcon,
  Trash2,
  Edit2,
  Link2,
  Palette,
  AlertTriangle,
  GitMerge,
} from "lucide-react";
import Link from "next/link";

interface TagData {
  id: string;
  name: string;
  color?: string;
  _count?: {
    links: number;
  };
  linkCount?: number;
}

interface TagStatistics {
  totalTags: number;
  usedTags: number;
  unusedTags: number;
  tags: TagData[];
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

export default function TagsPage() {
  const t = useTranslations("tags");
  const [tags, setTags] = useState<TagData[]>([]);
  const [statistics, setStatistics] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  // Form state
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("#3b82f6");
  const [deletingTag, setDeletingTag] = useState<TagData | null>(null);

  // Merge state
  const [sourceTagId, setSourceTagId] = useState("");
  const [targetTagId, setTargetTagId] = useState("");

  // Error state
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const orgId = getCurrentOrganizationId();

  useEffect(() => {
    if (orgId) {
      fetchTags();
      fetchStatistics();
    }
  }, [orgId]);

  const fetchTags = async () => {
    try {
      setError("");
      const res = await apiRequest(`/tags?orgId=${orgId}`);
      setTags(res);
    } catch (error: any) {
      console.error("Failed to fetch tags", error);
      // Handle permission errors specifically
      if (error?.status === 403 || error?.message?.includes("permission")) {
        setError(t("permissionDenied"));
        } else {
        setError(error?.message || t("failedToLoadTags"));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await apiRequest(`/tags/statistics?orgId=${orgId}`);
      setStatistics(res);
    } catch (error) {
      console.error("Failed to fetch tag statistics", error);
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      setError(t("tagNameRequired"));
      return;
    }

    setSubmitLoading(true);
    setError("");

    try {
      await apiRequest("/tags", {
        method: "POST",
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          orgId,
        }),
      });

      setNewTagName("");
      setNewTagColor("#3b82f6");
      setCreateDialogOpen(false);
      await fetchTags();
      await fetchStatistics();
    } catch (error: any) {
      console.error("Failed to create tag", error);
      setError(error?.message || t("failedToCreateTag"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editTagName.trim()) {
      setError(t("tagNameRequired"));
      return;
    }

    if (!editingTag) return;

    setSubmitLoading(true);
    setError("");

    try {
      await apiRequest(`/tags/${editingTag.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editTagName.trim(),
          color: editTagColor,
        }),
      });

      setEditingTag(null);
      setEditTagName("");
      setEditTagColor("#3b82f6");
      setEditDialogOpen(false);
      await fetchTags();
      await fetchStatistics();
    } catch (error: any) {
      console.error("Failed to update tag", error);
      setError(error?.message || t("failedToUpdateTag"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    setSubmitLoading(true);
    setError("");

    try {
      await apiRequest(`/tags/${deletingTag.id}`, {
        method: "DELETE",
      });

      setDeletingTag(null);
      setDeleteDialogOpen(false);
      await fetchTags();
      await fetchStatistics();
    } catch (error: any) {
      console.error("Failed to delete tag", error);
      setError(error?.message || t("failedToDeleteTag"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!sourceTagId || !targetTagId) {
      setError(t("selectBothTags"));
      return;
    }

    if (sourceTagId === targetTagId) {
      setError(t("differentTagsRequired"));
      return;
    }

    setSubmitLoading(true);
    setError("");

    try {
      await apiRequest(`/tags/${sourceTagId}/merge`, {
        method: "POST",
        body: JSON.stringify({ targetTagId }),
      });

      setSourceTagId("");
      setTargetTagId("");
      setMergeDialogOpen(false);
      await fetchTags();
      await fetchStatistics();
    } catch (error: any) {
      console.error("Failed to merge tags", error);
      setError(error?.message || t("failedToMergeTags"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditDialog = (tag: TagData) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || "#3b82f6");
    setError("");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: TagData) => {
    setDeletingTag(tag);
    setError("");
    setDeleteDialogOpen(true);
  };

  const getLinkCount = (tag: TagData): number => {
    return tag._count?.links || tag.linkCount || 0;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-64" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
      </div>
    );
  }

  // Show error state if there's an error and no tags
  if (error && tags.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t("unableToLoadTags")}
                </h3>
                <p className="text-red-700 mb-6 max-w-sm mx-auto">
                  {error}
                </p>
                <Button
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    fetchTags();
                    fetchStatistics();
                  }}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  {t("tryAgain")}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  const totalLinks = tags.reduce((sum, tag) => sum + getLinkCount(tag), 0);
  const usedTagsCount = tags.filter((tag) => getLinkCount(tag) > 0).length;
  const unusedTagsCount = tags.length - usedTagsCount;

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
          <div className="flex gap-2">
            <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-5 rounded-xl border-slate-200"
                >
                  <GitMerge className="mr-2 h-4 w-4" /> {t("mergeTags")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GitMerge className="h-5 w-5 text-purple-600" />
                    {t("mergeTags")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("mergeTagsDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="source-tag" className="text-slate-700 font-medium">
                      {t("sourceTag")}
                    </Label>
                    <Select value={sourceTagId} onValueChange={setSourceTagId}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder={t("selectSourceTag")} />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: tag.color || "#3b82f6" }}
                              />
                                 {tag.name} ({getLinkCount(tag)} {getLinkCount(tag) === 1 ? t("link") : t("links")})
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-tag" className="text-slate-700 font-medium">
                      {t("targetTag")}
                    </Label>
                    <Select value={targetTagId} onValueChange={setTargetTagId}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder={t("selectTargetTag")} />
                      </SelectTrigger>
                      <SelectContent>
                        {tags
                          .filter((tag) => tag.id !== sourceTagId)
                          .map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: tag.color || "#3b82f6" }}
                                />
                                {tag.name} ({getLinkCount(tag)} {getLinkCount(tag) === 1 ? t("link") : t("links")})
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
                      setMergeDialogOpen(false);
                      setSourceTagId("");
                      setTargetTagId("");
                      setError("");
                    }}
                    className="rounded-lg"
                    disabled={submitLoading}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={handleMerge}
                    disabled={!sourceTagId || !targetTagId || submitLoading}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {submitLoading ? t("merging") : t("mergeTags")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                  <Plus className="mr-2 h-4 w-4" /> {t("newTag")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    {t("createTag")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("createTagDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      {t("tagName")}
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("tagNamePlaceholder")}
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      {t("tagColor")}
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewTagColor(color.value)}
                          className={`h-10 w-full rounded-lg transition-all ${
                            newTagColor === color.value
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
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
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
                      setNewTagName("");
                      setNewTagColor("#3b82f6");
                      setError("");
                    }}
                    className="rounded-lg"
                    disabled={submitLoading}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newTagName.trim() || submitLoading}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {submitLoading ? t("creating") : t("createTag")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TagsIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {statistics?.totalTags || tags.length}
                  </p>
                  <p className="text-sm text-blue-600">{t("totalTags")}</p>
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
                    {statistics?.usedTags || usedTagsCount}
                  </p>
                  <p className="text-sm text-emerald-600">{t("usedTags")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {statistics?.unusedTags || unusedTagsCount}
                  </p>
                  <p className="text-sm text-amber-600">{t("unusedTags")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags Grid */}
        {tags.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <TagsIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("noTagsYet")}
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {t("createFirstTag")}
                </p>
                <Dialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                      <Plus className="mr-2 h-4 w-4" /> {t("createYourFirstTag")}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => {
              const linkCount = getLinkCount(tag);
              return (
                <Card
                  key={tag.id}
                  className="relative group border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Color Bar */}
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: tag.color || "#3b82f6" }}
                  />
                  <CardHeader className="pt-5 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${tag.color || "#3b82f6"}20`,
                          }}
                        >
                          <Tag
                            className="h-6 w-6"
                            style={{ color: tag.color || "#3b82f6" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {tag.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {linkCount} {linkCount === 1 ? t("link") : t("links")}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      {linkCount > 0 && (
                        <Link
                          href={`/dashboard/links?tag=${tag.id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg border-slate-200 hover:bg-slate-50"
                          >
                            <Link2 className="mr-2 h-3.5 w-3.5" />
                            {t("viewLinks")}
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                        className="rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(tag)}
                        className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                {t("editTag")}
              </DialogTitle>
              <DialogDescription>
                {t("updateTagDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-700 font-medium">
                  {t("tagName")}
                </Label>
                <Input
                  id="edit-name"
                  placeholder={t("tagNamePlaceholder")}
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Tag Color
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditTagColor(color.value)}
                      className={`h-10 w-full rounded-lg transition-all ${
                        editTagColor === color.value
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
                    value={editTagColor}
                    onChange={(e) => setEditTagColor(e.target.value)}
                    className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={editTagColor}
                    onChange={(e) => setEditTagColor(e.target.value)}
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
                  setEditDialogOpen(false);
                  setEditingTag(null);
                  setEditTagName("");
                  setEditTagColor("#3b82f6");
                  setError("");
                }}
                className="rounded-lg"
                disabled={submitLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!editTagName.trim() || submitLoading}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitLoading ? t("updating") : t("updateTag")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                {t("deleteTag")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deletingTag && getLinkCount(deletingTag) > 0 ? (
                  <div className="space-y-2">
                    <p>
                      {t("deleteTagConfirmPrefix")} <strong>{deletingTag.name}</strong>?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                          {t("tagUsedBy")} {getLinkCount(deletingTag)} {getLinkCount(deletingTag) === 1 ? t("link") : t("links")}{t("tagDeleteWarning")}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>
                    {t("deleteTagConfirmPrefix")} <strong>{deletingTag?.name}</strong>?
                    {t("thisActionCannotBeUndone")}
                  </p>
                )}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-3">
                    {error}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingTag(null);
                  setError("");
                }}
                disabled={submitLoading}
              >
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={submitLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitLoading ? t("deleting") : t("deleteTag")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
