"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@pingtome/ui";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { Folder, FolderX } from "lucide-react";

interface FolderData {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  children?: FolderData[];
}

interface MoveLinkToFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  currentFolderId?: string | null;
  onMoved: () => void;
}

export function MoveLinkToFolderDialog({
  isOpen,
  onClose,
  linkId,
  currentFolderId,
  onMoved,
}: MoveLinkToFolderDialogProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(
    currentFolderId || "none"
  );
  const [loading, setLoading] = useState(false);
  const [fetchingFolders, setFetchingFolders] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setSelectedFolder(currentFolderId || "none");
    }
  }, [isOpen, currentFolderId]);

  const fetchFolders = async () => {
    setFetchingFolders(true);
    try {
      const response = await apiRequest("/folders/tree");
      // Flatten the tree structure for the select dropdown
      const flattenedFolders = flattenFolderTree(response);
      setFolders(flattenedFolders);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setFetchingFolders(false);
    }
  };

  // Helper function to flatten folder tree into a list with depth information
  const flattenFolderTree = (
    folders: FolderData[],
    depth = 0
  ): Array<FolderData & { depth: number }> => {
    const result: Array<FolderData & { depth: number }> = [];

    folders.forEach((folder) => {
      result.push({ ...folder, depth });
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFolderTree(folder.children, depth + 1));
      }
    });

    return result;
  };

  const handleMove = async () => {
    if (selectedFolder === currentFolderId || (selectedFolder === "none" && !currentFolderId)) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const body =
        selectedFolder === "none"
          ? { folderId: null }
          : { folderId: selectedFolder };

      await apiRequest(`/links/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      if (selectedFolder === "none") {
        toast.success("Link removed from folder");
      } else {
        const folderName = folders.find((f) => f.id === selectedFolder)?.name;
        toast.success(`Link moved to ${folderName || "folder"}`);
      }

      onMoved();
      onClose();
    } catch (error: any) {
      console.error("Failed to move link:", error);
      if (error?.response?.status === 403) {
        toast.error("Permission denied", {
          description: "You don't have permission to move this link",
        });
      } else {
        toast.error("Failed to move link");
      }
    } finally {
      setLoading(false);
    }
  };

  const hasChanged = selectedFolder !== (currentFolderId || "none");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            Move to Folder
          </DialogTitle>
          <DialogDescription>
            Choose a folder to organize this link, or remove it from its current
            folder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fetchingFolders ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="h-11 rounded-lg">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <FolderX className="h-4 w-4 text-slate-400" />
                    <span>No Folder</span>
                  </div>
                </SelectItem>
                {folders.map((folder: any) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${(folder.depth || 0) * 16}px` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color || "#3b82f6" }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {folders.length === 0 && (
                  <div className="px-2 py-6 text-center text-sm text-slate-500">
                    No folders available.
                    <br />
                    Create one from the Folders page.
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={loading || fetchingFolders || !hasChanged}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
