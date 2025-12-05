"use client";

import { useEffect, useState } from "react";
import { LinkResponse } from "@pingtome/types";
import { apiRequest } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@pingtome/ui";
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  QrCode,
  Trash2,
  BarChart2,
  PauseCircle,
  PlayCircle,
  Archive,
  Tags,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { QrCodeModal } from "./QrCodeModal";
import { EditLinkModal } from "./EditLinkModal";

interface LinksTableProps {
  limit?: number;
  hideFilters?: boolean;
}

export function LinksTable({ limit, hideFilters = false }: LinksTableProps) {
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalLink, setQrModalLink] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState<string>("");

  useEffect(() => {
    fetchFilters();
    fetchLinks();
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [selectedTag, selectedCampaign]);

  const fetchFilters = async () => {
    try {
      const [tagsRes, campaignsRes] = await Promise.all([
        apiRequest("/tags"),
        apiRequest("/campaigns"),
      ]);
      setTags(tagsRes);
      setCampaigns(campaignsRes);
    } catch (error) {
      console.error("Failed to fetch filters");
    }
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedTag && selectedTag !== "all")
        query.append("tag", selectedTag);
      if (selectedCampaign && selectedCampaign !== "all")
        query.append("campaignId", selectedCampaign);
      if (limit) query.append("limit", limit.toString());

      const response = await apiRequest(`/links?${query.toString()}`);
      const linksData = response.data || response;
      setLinks(limit ? linksData.slice(0, limit) : linksData);
      setSelectedIds(new Set()); // Clear selection on refresh
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!"); // TODO: Replace with proper toast
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await apiRequest(`/links/${id}`, { method: "DELETE" });
      fetchLinks();
    } catch (error) {
      alert("Failed to delete link");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} links?`))
      return;
    try {
      await apiRequest("/links/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      fetchLinks();
    } catch (error) {
      alert("Failed to delete links");
    }
  };

  const handleBulkTag = async () => {
    if (!bulkTagValue) return;
    try {
      await apiRequest("/links/bulk-tag", {
        method: "POST",
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          tagName: bulkTagValue,
        }),
      });
      setBulkTagDialogOpen(false);
      setBulkTagValue("");
      fetchLinks();
      alert(`Added tag "${bulkTagValue}" to ${selectedIds.size} links`);
    } catch (error) {
      alert("Failed to add tags");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiRequest(`/links/${id}`, {
        method: "POST", // Using POST as per controller update
        body: JSON.stringify({ status }),
      });
      fetchLinks();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-4">
      {!hideFilters && !limit && (
        <div className="flex gap-4">
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagDialogOpen} onOpenChange={setBulkTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Links</DialogTitle>
            <DialogDescription>
              Add a tag to {selectedIds.size} selected link(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkTagValue} onValueChange={setBulkTagValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkTagDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkTag} disabled={!bulkTagValue}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        {selectedIds.size > 0 && (
          <div className="p-4 bg-muted flex justify-between items-center border-b">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkTagDialogOpen(true)}
              >
                <Tags className="mr-2 h-4 w-4" /> Tag Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    links.length > 0 && selectedIds.size === links.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Short Link</TableHead>
              <TableHead>Original URL</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Loading links...
                </TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No links found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow
                  key={link.id}
                  data-state={selectedIds.has(link.id) && "selected"}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(link.id)}
                      onCheckedChange={() => toggleSelectOne(link.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium relative">
                    <div className="flex items-center space-x-2">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary"
                      >
                        {link.slug}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(link.shortUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setQrModalLink(link)}
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </div>
                    {link.title && (
                      <div className="text-xs text-muted-foreground">
                        {link.title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <span title={link.originalUrl}>{link.originalUrl}</span>
                  </TableCell>
                  <TableCell>0</TableCell> {/* TODO: Add click count */}
                  <TableCell>
                    {format(new Date(link.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        link.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditLinkModal
                          link={{
                            id: link.id,
                            title: link.title,
                            campaignId: (link as any).campaignId,
                            expirationDate: (link as any).expirationDate,
                          }}
                          onSuccess={fetchLinks}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </EditLinkModal>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/analytics/${link.id}`}>
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(
                              link.id,
                              link.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
                            )
                          }
                        >
                          {link.status === "ACTIVE" ? (
                            <>
                              <PauseCircle className="mr-2 h-4 w-4" /> Disable
                            </>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" /> Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(link.id, "ARCHIVED")
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {qrModalLink && (
          <QrCodeModal
            isOpen={!!qrModalLink}
            onClose={() => setQrModalLink(null)}
            link={qrModalLink}
          />
        )}
      </div>
    </div>
  );
}
