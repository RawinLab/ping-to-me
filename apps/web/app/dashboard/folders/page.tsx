"use client";

import { useEffect, useState } from "react";
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
} from "@pingtome/ui";
import { Plus, Folder, Trash2, FolderOpen, Link2, ExternalLink, Palette } from "lucide-react";
import Link from "next/link";

interface FolderData {
  id: string;
  name: string;
  color?: string;
  _count: {
    links: number;
  };
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

export default function FoldersPage() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await apiRequest("/folders");
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
        body: JSON.stringify({ name: newFolderName, color: newFolderColor }),
      });
      setNewFolderName("");
      setNewFolderColor("#3b82f6");
      setCreateDialogOpen(false);
      fetchFolders();
    } catch (error) {
      alert("Failed to create folder");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? Links will be unassigned but not deleted."
      )
    )
      return;

    try {
      await apiRequest(`/folders/${id}`, { method: "DELETE" });
      fetchFolders();
    } catch (error) {
      alert("Failed to delete folder");
    }
  };

  const totalLinks = folders.reduce((sum, f) => sum + f._count.links, 0);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
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
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Folders
            </h1>
            <p className="text-slate-500 mt-1">
              Organize your links into folders for better management.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                <Plus className="mr-2 h-4 w-4" /> New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  Create Folder
                </DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your links.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Folder Name</Label>
                  <Input
                    id="name"
                    placeholder="My Folder"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Folder Color
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
                  onClick={() => setCreateDialogOpen(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newFolderName.trim()}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <p className="text-2xl font-bold text-blue-700">{folders.length}</p>
                  <p className="text-sm text-blue-600">Total Folders</p>
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
                  <p className="text-2xl font-bold text-emerald-700">{totalLinks}</p>
                  <p className="text-sm text-emerald-600">Links Organized</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No folders yet
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Create your first folder to start organizing your links for easier management.
                </p>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                      <Plus className="mr-2 h-4 w-4" /> Create Your First Folder
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="relative group border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Color Bar */}
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: folder.color || "#3b82f6" }}
                />
                <CardHeader className="pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${folder.color || "#3b82f6"}20` }}
                      >
                        <Folder
                          className="h-6 w-6"
                          style={{ color: folder.color || "#3b82f6" }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg truncate max-w-[150px]">
                          {folder.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5" />
                          {folder._count.links} {folder._count.links === 1 ? "link" : "links"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/links?folder=${folder.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg border-slate-200 hover:bg-slate-50"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        View Links
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(folder.id)}
                      className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
