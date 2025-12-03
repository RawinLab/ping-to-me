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
} from "@pingtome/ui";
import { ExternalLink, Copy, MoreHorizontal, QrCode } from "lucide-react";
import { format } from "date-fns";

export function LinksTable() {
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQr, setActiveQr] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await apiRequest<{ data: LinkResponse[] }>(
        "GET",
        "/links"
      );
      setLinks(response.data);
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast
  };

  if (loading) {
    return <div>Loading links...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center h-24">
                No links found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            links.map((link) => (
              <TableRow key={link.id}>
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
                    {link.qrCode && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setActiveQr(activeQr === link.id ? null : link.id)
                          }
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                        {activeQr === link.id && (
                          <div className="absolute top-8 left-0 z-50 bg-white p-2 border rounded shadow-lg">
                            <img
                              src={link.qrCode}
                              alt="QR Code"
                              className="w-32 h-32"
                            />
                          </div>
                        )}
                      </div>
                    )}
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
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
