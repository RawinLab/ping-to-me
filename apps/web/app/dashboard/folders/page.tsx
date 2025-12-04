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
import { Plus, Folder, Trash2, Edit } from "lucide-react";

interface FolderData {
  id: string;
  name: string;
  color?: string;
  _count: {
    links: number;
  };
}

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

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Organize your links into folders.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your links.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Folder Name</Label>
                <Input
                  id="name"
                  placeholder="My Folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No folders yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          folders.map((folder) => (
            <Card key={folder.id} className="relative group">
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                style={{ backgroundColor: folder.color || "#3b82f6" }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder
                    className="h-5 w-5"
                    style={{ color: folder.color || "#3b82f6" }}
                  />
                  {folder.name}
                </CardTitle>
                <CardDescription>
                  {folder._count.links}{" "}
                  {folder._count.links === 1 ? "link" : "links"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm">
                    View Links
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(folder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
