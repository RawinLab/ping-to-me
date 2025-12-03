"use client";

import { useState, useEffect } from "react";
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

interface Tag {
  id: string;
  name: string;
  color?: string;
}

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await apiRequest("/tags");
      setTags(response);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTag.trim()) return;
    try {
      await apiRequest("/tags", {
        method: "POST",
        body: JSON.stringify({
          name: newTag,
          color: newColor,
          orgId: "default",
        }), // TODO: Handle orgId
      });
      setNewTag("");
      fetchTags();
    } catch (error) {
      alert("Failed to create tag");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await apiRequest(`/tags/${id}`, { method: "DELETE" });
      fetchTags();
    } catch (error) {
      alert("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Tag Name</label>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. Marketing"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Color</label>
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
          <Plus className="mr-2 h-4 w-4" /> Add Tag
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No tags found.
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
