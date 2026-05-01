"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest, getCurrentOrganizationId } from "@/lib/api";
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
  Badge,
  Checkbox,
} from "@pingtome/ui";
import {
  Plus,
  Webhook,
  Trash2,
  ExternalLink,
  Key,
  ChevronRight,
  Code,
  Terminal,
  Copy,
  Check,
  Zap,
  Link2,
  MousePointer,
  Trash,
  RefreshCw,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  active: boolean;
}

const developerNavItems = [
  { title: "apiKeysTitle", href: "/dashboard/developer/api-keys", icon: Key },
  {
    title: "webhooksTitle",
    href: "/dashboard/developer/webhooks",
    icon: Webhook,
    active: true,
  },
];

const AVAILABLE_EVENTS = [
  {
    id: "link.created",
    labelKey: "linkCreated",
    icon: Plus,
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    id: "link.clicked",
    labelKey: "linkClicked",
    icon: MousePointer,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: "link.deleted",
    labelKey: "linkDeleted",
    icon: Trash,
    color: "text-red-600 bg-red-100",
  },
  {
    id: "link.updated",
    labelKey: "linkUpdated",
    icon: RefreshCw,
    color: "text-amber-600 bg-amber-100",
  },
  {
    id: "bio.viewed",
    labelKey: "bioPageViewed",
    icon: Eye,
    color: "text-purple-600 bg-purple-100",
  },
];

export default function WebhooksPage() {
  const t = useTranslations("developer");
  const tc = useTranslations("common");
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
        body: JSON.stringify({ url: newUrl, events: selectedEvents, orgId: getCurrentOrganizationId() }),
      });

      setNewUrl("");
      setSelectedEvents([]);
      setCreateDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      alert(t("failedToCreateWebhook"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteWebhookConfirm"))) return;

    try {
      await apiRequest(`/developer/webhooks/${id}`, { method: "DELETE" });
      fetchWebhooks();
    } catch (error) {
      alert(t("failedToDeleteWebhook"));
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId],
    );
  };

  const copyPayload = () => {
    const payload = `{
  "event": "link.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "abc123",
    "slug": "my-link",
    "originalUrl": "https://example.com",
    "shortUrl": "https://pingto.me/my-link"
  }
}`;
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-200 rounded w-72" />
            <div className="grid lg:grid-cols-[240px_1fr] gap-8">
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl" />
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {t("developerTitle")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("developerWebhookSubtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Developer Navigation */}
          <nav className="space-y-1">
            {developerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.title)}
                  {!item.active && (
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {t("webhooksTitle")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("webhooksSubtitle")}
                </p>
              </div>
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    <Plus className="mr-2 h-4 w-4" /> {t("addWebhook")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-blue-600" />
                      {t("addWebhook")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("configureWebhook")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="url"
                        className="text-slate-700 font-medium"
                      >
                        {t("endpointUrl")}
                      </Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder={t("endpointUrlPlaceholder")}
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">
                        {t("eventsToSubscribe")}
                      </Label>
                      <div className="space-y-2">
                        {AVAILABLE_EVENTS.map((event) => {
                          const EventIcon = event.icon;
                          return (
                            <div
                              key={event.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedEvents.includes(event.id)
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                              onClick={() => toggleEvent(event.id)}
                            >
                              <Checkbox
                                id={event.id}
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={() => toggleEvent(event.id)}
                              />
                              <div
                                className={`h-8 w-8 rounded-lg ${event.color} flex items-center justify-center`}
                              >
                                <EventIcon className="h-4 w-4" />
                              </div>
                              <Label
                                htmlFor={event.id}
                                className="font-medium cursor-pointer flex-1"
                              >
                                {t(event.labelKey)}
                              </Label>
                              <code className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {event.id}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="rounded-lg"
                    >
                      {tc("cancel")}
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        creating || !newUrl || selectedEvents.length === 0
                      }
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {creating ? t("creatingWebhook") : t("createWebhook")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            {webhooks.length > 0 ? (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <Card
                    key={webhook.id}
                    className="border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                            <Webhook className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg truncate max-w-[300px] text-slate-700 font-mono">
                                {webhook.url}
                              </code>
                              <a
                                href={webhook.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {webhook.events.map((event) => {
                                const eventInfo = AVAILABLE_EVENTS.find(
                                  (e) => e.id === event,
                                );
                                return (
                                  <Badge
                                    key={event}
                                    className={`${eventInfo?.color || "bg-slate-100 text-slate-600"} border-0 text-xs`}
                                  >
                                    {eventInfo ? t(eventInfo.labelKey) : event}
                                  </Badge>
                                );
                              })}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              {t("created")}{" "}
                              {format(
                                new Date(webhook.createdAt),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(webhook.id)}
                          className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-slate-200 border-dashed">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4">
                      <Webhook className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {t("noWebhooksConfigured")}
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                      {t("noWebhooksDescription")}
                    </p>
                    <Dialog
                      open={createDialogOpen}
                      onOpenChange={setCreateDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                          <Plus className="mr-2 h-4 w-4" /> {t("addYourFirstWebhook")}
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payload Example */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Code className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t("payloadFormat")}</CardTitle>
                    <CardDescription>
                      {t("payloadExample")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">
                      {t("json")}
                    </span>
                  </div>
                  <button
                    onClick={copyPayload}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{t("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t("copy")}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-800 p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300 font-mono">
                    {`{
  `}
                    <span className="text-purple-400">&quot;event&quot;</span>
                    {`: `}
                    <span className="text-emerald-400">
                      &quot;link.created&quot;
                    </span>
                    {`,
  `}
                    <span className="text-purple-400">
                      &quot;timestamp&quot;
                    </span>
                    {`: `}
                    <span className="text-emerald-400">
                      &quot;2024-01-15T10:30:00Z&quot;
                    </span>
                    {`,
  `}
                    <span className="text-purple-400">&quot;data&quot;</span>
                    {`: {
    `}
                    <span className="text-purple-400">&quot;id&quot;</span>
                    {`: `}
                    <span className="text-emerald-400">&quot;abc123&quot;</span>
                    {`,
    `}
                    <span className="text-purple-400">&quot;slug&quot;</span>
                    {`: `}
                    <span className="text-emerald-400">
                      &quot;my-link&quot;
                    </span>
                    {`,
    `}
                    <span className="text-purple-400">
                      &quot;originalUrl&quot;
                    </span>
                    {`: `}
                    <span className="text-emerald-400">
                      &quot;https://example.com&quot;
                    </span>
                    {`,
    `}
                    <span className="text-purple-400">
                      &quot;shortUrl&quot;
                    </span>
                    {`: `}
                    <span className="text-emerald-400">
                      &quot;https://pingto.me/my-link&quot;
                    </span>
                    {`
  }
}`}
                  </code>
                </pre>
              </CardContent>
            </Card>

            {/* Available Events */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  {t("availableEvents")}
                </CardTitle>
                <CardDescription>
                  {t("availableEventsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_EVENTS.map((event) => {
                    const EventIcon = event.icon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                      >
                        <div
                          className={`h-10 w-10 rounded-lg ${event.color} flex items-center justify-center`}
                        >
                          <EventIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {t(event.labelKey)}
                          </p>
                          <code className="text-xs text-slate-500">
                            {event.id}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
