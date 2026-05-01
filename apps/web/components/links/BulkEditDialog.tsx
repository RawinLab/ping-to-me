"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@pingtome/ui";
import {
  X,
  Plus,
  Calendar,
  Tag,
  FolderOpen,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

interface BulkEditDialogProps {
  selectedIds: string[];
  onSuccess: () => void;
  children: React.ReactNode;
}

interface Folder {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
}

export function BulkEditDialog({
  selectedIds,
  onSuccess,
  children,
}: BulkEditDialogProps) {
  const t = useTranslations("links.bulk");
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const [folderId, setFolderId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagsAction, setTagsAction] = useState<"add" | "replace" | "remove">(
    "add",
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [foldersRes, campaignsRes, tagsRes] = await Promise.all([
        apiRequest("/folders").catch(() => []),
        apiRequest("/campaigns").catch(() => []),
        apiRequest("/tags").catch(() => []),
      ]);
      setFolders(foldersRes);
      setCampaigns(campaignsRes);
      setAvailableTags(tagsRes);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput("");
  };

  const removeTag = (tagName: string) => {
    setTags(tags.filter((t) => t !== tagName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      toast.error(t("noLinksSelected"));
      return;
    }

    const changes: {
      folderId?: string | null;
      campaignId?: string | null;
      expirationDate?: string;
      tags?: string[];
      tagsAction?: "add" | "replace" | "remove";
    } = {};

    if (folderId !== null) {
      changes.folderId = folderId === "none" ? null : folderId;
    }

    if (campaignId !== null) {
      changes.campaignId = campaignId === "none" ? null : campaignId;
    }

    if (expirationDate) {
      changes.expirationDate = expirationDate;
    }

    if (tags.length > 0) {
      changes.tags = tags;
      changes.tagsAction = tagsAction;
    }

    if (Object.keys(changes).length === 0) {
      toast.error(t("noChangesToApply"));
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/links/bulk-edit", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedIds,
          changes,
        }),
      });

      toast.success(
        t("updatedSuccess", { count: selectedIds.length }),
      );

      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Bulk edit failed:", error);
      toast.error(error?.message || t("failedToUpdate"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFolderId(null);
    setCampaignId(null);
    setExpirationDate("");
    setTags([]);
    setTagsAction("add");
    setNewTagInput("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("bulkEditLinks")}</DialogTitle>
          <DialogDescription>
            {t("bulkEditDesc", { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="folder" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              {t("folder")}
            </Label>
            <Select
              value={folderId || "unchanged"}
              onValueChange={(value) =>
                setFolderId(value === "unchanged" ? null : value)
              }
            >
              <SelectTrigger id="folder">
                <SelectValue placeholder={t("keepCurrent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unchanged">{t("keepCurrent")}</SelectItem>
                <SelectItem value="none">{t("noFolder")}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign" className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              {t("campaign")}
            </Label>
            <Select
              value={campaignId || "unchanged"}
              onValueChange={(value) =>
                setCampaignId(value === "unchanged" ? null : value)
              }
            >
              <SelectTrigger id="campaign">
                <SelectValue placeholder={t("keepCurrent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unchanged">{t("keepCurrent")}</SelectItem>
                <SelectItem value="none">{t("noCampaign")}</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              {t("expirationDateOptional")}
            </Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <p className="text-xs text-slate-500">
              {t("leaveEmptyExpiration")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                {t("tags")}
              </Label>
              <Select
                value={tagsAction}
                onValueChange={(value: "add" | "replace" | "remove") =>
                  setTagsAction(value)
                }
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">{t("addTag")}</SelectItem>
                  <SelectItem value="replace">{t("replaceTag")}</SelectItem>
                  <SelectItem value="remove">{t("removeTag")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-slate-50">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 px-2.5 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) addTag(value);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("selectExistingTag")} />
                </SelectTrigger>
                <SelectContent>
                  {availableTags
                    .filter((t) => !tags.includes(t.name))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder={t("newTag")}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(newTagInput);
                    }
                  }}
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {tagsAction === "add" && t("addTagDesc")}
              {tagsAction === "replace" && t("replaceTagDesc")}
              {tagsAction === "remove" && t("removeTagDesc")}
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("applyingChanges") : t("applyChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
