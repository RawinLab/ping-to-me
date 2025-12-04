"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Checkbox,
} from "@pingtome/ui";
import { Plus, Webhook, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  active: boolean;
}

const AVAILABLE_EVENTS = [
  { id: "link.created", label: "Link Created" },
  { id: "link.clicked", label: "Link Clicked" },
  { id: "link.deleted", label: "Link Deleted" },
  { id: "link.updated", label: "Link Updated" },
  { id: "bio.viewed", label: "Bio Page Viewed" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await apiRequest("/developer/webhooks");
      setWebhooks(res || []);
    } catch (error) {
      console.error("Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || selectedEvents.length === 0) return;

    setCreating(true);
    try {
      await apiRequest("/developer/webhooks", {
        method: "POST",
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      });

      setNewUrl("");
      setSelectedEvents([]);
      setCreateDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      alert("Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      await apiRequest(`/developer/webhooks/${id}`, { method: "DELETE" });
      fetchWebhooks();
    } catch (error) {
      alert("Failed to delete webhook");
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Receive real-time notifications for events.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive event notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-center gap-2">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <Label
                        htmlFor={event.id}
                        className="font-normal cursor-pointer"
                      >
                        {event.label}
                      </Label>
                    </div>
                  ))}
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
              <Button
                onClick={handleCreate}
                disabled={creating || !newUrl || selectedEvents.length === 0}
              >
                {creating ? "Creating..." : "Create Webhook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Your Webhooks
          </CardTitle>
          <CardDescription>
            Endpoints that receive event notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                          {webhook.url}
                        </code>
                        <a href={webhook.url} target="_blank" rel="noopener">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge
                            key={event}
                            variant="secondary"
                            className="text-xs"
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <Webhook className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No webhooks configured
              </h3>
              <p className="text-muted-foreground mb-4">
                Add a webhook to receive real-time event notifications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Payload Example */}
      <Card>
        <CardHeader>
          <CardTitle>Payload Format</CardTitle>
          <CardDescription>
            Example of the webhook payload you will receive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            {`{
  "event": "link.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "abc123",
    "slug": "my-link",
    "originalUrl": "https://example.com",
    "shortUrl": "https://pingto.me/my-link"
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
