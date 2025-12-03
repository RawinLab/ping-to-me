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
} from "@pingtome/ui";
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  QrCode,
  Trash2,
  BarChart2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { QrCodeModal } from "./QrCodeModal";

export function LinksTable() {
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalLink, setQrModalLink] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await apiRequest("/links");
      setLinks(response.data);
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

  if (loading) {
    return <div>Loading links...</div>;
  }

  return (
    <div className="rounded-md border bg-white">
      {selectedIds.size > 0 && (
        <div className="p-4 bg-muted flex justify-between items-center border-b">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={links.length > 0 && selectedIds.size === links.length}
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
          {links.length === 0 ? (
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
                    variant={link.status === "ACTIVE" ? "default" : "secondary"}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/analytics/${link.id}`}>
                          <BarChart2 className="mr-2 h-4 w-4" />
                          Analytics
                        </Link>
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
  );
}
