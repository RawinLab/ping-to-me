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
} from "@pingtome/ui";
import { Pencil } from "lucide-react";

const editLinkSchema = z.object({
  title: z.string().optional(),
  campaignId: z.string().optional(),
  expirationDate: z.string().optional(),
});

type EditLinkFormData = z.infer<typeof editLinkSchema>;

interface EditLinkModalProps {
  link: {
    id: string;
    title?: string;
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
    []
  );

  const form = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      title: link.title || "",
      campaignId: link.campaignId || "none",
      expirationDate: link.expirationDate?.split("T")[0] || "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchCampaigns();
    }
  }, [open]);

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest("/campaigns");
      setCampaigns(res);
    } catch (error) {
      console.error("Failed to fetch campaigns");
    }
  };

  const onSubmit = async (data: EditLinkFormData) => {
    setSaving(true);
    try {
      await apiRequest(`/links/${link.id}`, {
        method: "POST",
        body: JSON.stringify({
          title: data.title || undefined,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update link settings and assign to a campaign.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="My Link"
              {...form.register("title")}
            />
          </div>

          {/* Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign</Label>
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
            <Label htmlFor="expirationDate">Expiration Date (optional)</Label>
            <Input
              id="expirationDate"
              type="date"
              {...form.register("expirationDate")}
            />
          </div>

          <DialogFooter>
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
