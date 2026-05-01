"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@pingtome/ui";
import { Trash2, Plus } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

export function TagsManager() {
  const t = useTranslations("tags");
  const { currentOrg } = useOrganization();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      fetchTags();
    }
  }, [currentOrg]);

  const fetchTags = async () => {
    if (!currentOrg) return;
    try {
      const response = await apiRequest(`/tags?orgId=${currentOrg.id}`);
      setTags(response);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTag.trim() || !currentOrg) return;
    try {
      await apiRequest("/tags", {
        method: "POST",
        body: JSON.stringify({
          name: newTag,
          color: newColor,
          orgId: currentOrg.id,
        }),
      });
      setNewTag("");
      fetchTags();
    } catch (error) {
      alert(t("failedToCreateTag"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteThisTag"))) return;
    try {
      await apiRequest(`/tags/${id}`, { method: "DELETE" });
      fetchTags();
    } catch (error) {
      alert(t("failedToDeleteTag"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">{t("tagName")}</label>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t("tagNamePlaceholder2")}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">{t("tagColor")}</label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 p-1 h-10"
            />
            <Input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-24"
            />
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("createTag")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tagColor")}</TableHead>
              <TableHead>{t("tagName")}</TableHead>
              <TableHead className="text-right">{t("actionsCol")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  {t("noTagsFound")}
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: tag.color || "#000" }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
