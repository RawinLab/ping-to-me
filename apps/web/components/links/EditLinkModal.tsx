"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const editLinkSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  campaignId: z.string().optional(),
  expirationDate: z.string().optional(),
});

type EditLinkFormData = z.infer<typeof editLinkSchema>;

interface EditLinkModalProps {
  link: {
    id: string;
    originalUrl: string;
    title?: string;
    tags?: string[];
    campaignId?: string;
    expirationDate?: string;
  };
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditLinkModal({
  link,
  onSuccess,
  children,
}: EditLinkModalProps) {
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

  const form = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      originalUrl: link.originalUrl || "",
      title: link.title || "",
      campaignId: link.campaignId || "none",
      expirationDate: link.expirationDate?.split("T")[0] || "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchCampaigns();
      fetchTags();
      // Reset form values when modal opens
      form.reset({
        originalUrl: link.originalUrl || "",
        title: link.title || "",
        campaignId: link.campaignId || "none",
        expirationDate: link.expirationDate?.split("T")[0] || "",
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
        }),
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      alert("Failed to update link");
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
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update link details, tags, and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Destination URL */}
          <div className="space-y-2">
            <Label htmlFor="originalUrl" className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-500" />
              Destination URL
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="My Link"
              {...form.register("title")}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              Tags
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
                  <SelectValue placeholder="Select existing tag" />
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
                  placeholder="New tag"
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

          {/* Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaignId" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              Campaign
            </Label>
            <Select
              value={form.watch("campaignId")}
              onValueChange={(value) => form.setValue("campaignId", value)}
            >
              <SelectTrigger id="campaignId">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Expiration Date (optional)
            </Label>
            <Input
              id="expirationDate"
              type="date"
              {...form.register("expirationDate")}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
