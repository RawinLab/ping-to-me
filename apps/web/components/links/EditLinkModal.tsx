"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Pencil,
  X,
  Plus,
  Link2,
  Calendar,
  Tag,
  FolderOpen,
} from "lucide-react";

export function EditLinkModal({
  link,
  onSuccess,
  children,
}: {
  link: {
    id: string;
    originalUrl: string;
    title?: string;
    tags?: string[];
    campaignId?: string;
    expirationDate?: string;
    maxClicks?: number;
  };
  onSuccess?: () => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("links.edit");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [availableTags, setAvailableTags] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(link.tags || []);
  const [newTagInput, setNewTagInput] = useState("");

  const editLinkSchema = z.object({
    originalUrl: z.string().url(t("pleaseEnterValidUrl")),
    title: z.string().optional(),
    campaignId: z.string().optional(),
    expirationDate: z.string().optional(),
    maxClicks: z.string().optional(),
  });

  type EditLinkFormData = z.infer<typeof editLinkSchema>;

  const form = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      originalUrl: link.originalUrl || "",
      title: link.title || "",
      campaignId: link.campaignId || "none",
      expirationDate: link.expirationDate?.split("T")[0] || "",
      maxClicks: link.maxClicks ? String(link.maxClicks) : "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchCampaigns();
      fetchTags();
      form.reset({
        originalUrl: link.originalUrl || "",
        title: link.title || "",
        campaignId: link.campaignId || "none",
        expirationDate: link.expirationDate?.split("T")[0] || "",
        maxClicks: link.maxClicks ? String(link.maxClicks) : "",
      });
      setSelectedTags(link.tags || []);
    }
  }, [open, link]);

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest("/campaigns");
      setCampaigns(res);
    } catch (error) {
      console.error("Failed to fetch campaigns");
    }
  };

  const fetchTags = async () => {
    try {
      const res = await apiRequest("/tags");
      setAvailableTags(res);
    } catch (error) {
      console.error("Failed to fetch tags");
    }
  };

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setNewTagInput("");
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const onSubmit = async (data: EditLinkFormData) => {
    setSaving(true);
    try {
      await apiRequest(`/links/${link.id}`, {
        method: "POST",
        body: JSON.stringify({
          originalUrl: data.originalUrl,
          title: data.title || undefined,
          tags: selectedTags,
          campaignId: data.campaignId === "none" ? null : data.campaignId,
          expirationDate: data.expirationDate || undefined,
          maxClicks: data.maxClicks ? parseInt(data.maxClicks, 10) : undefined,
        }),
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      alert(t("failedToUpdate"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("editLink")}</DialogTitle>
          <DialogDescription>
            {t("editLinkDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="originalUrl" className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-500" />
              {t("destinationUrl")}
            </Label>
            <Input
              id="originalUrl"
              placeholder="https://example.com/your-page"
              {...form.register("originalUrl")}
              className={
                form.formState.errors.originalUrl ? "border-red-500" : ""
              }
            />
            {form.formState.errors.originalUrl && (
              <p className="text-sm text-red-500">
                {form.formState.errors.originalUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("titleOptional")}</Label>
            <Input
              id="title"
              placeholder="My Link"
              {...form.register("title")}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              {t("tags")}
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map((tag) => (
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
                    .filter((t) => !selectedTags.includes(t.name))
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignId" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              {t("campaign")}
            </Label>
            <Select
              value={form.watch("campaignId")}
              onValueChange={(value) => form.setValue("campaignId", value)}
            >
              <SelectTrigger id="campaignId">
                <SelectValue placeholder={t("selectCampaign")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noCampaign")}</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
              {...form.register("expirationDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxClicks">
              {t("clickLimit")} <span className="text-muted-foreground">{t("optional")}</span>
            </Label>
            <Input
              type="number"
              id="maxClicks"
              min="1"
              placeholder={t("unlimited")}
              {...form.register("maxClicks")}
            />
            <p className="text-xs text-muted-foreground">
              {t("clickLimitHelp")}
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
