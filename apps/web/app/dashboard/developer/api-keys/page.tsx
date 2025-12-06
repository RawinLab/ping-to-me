"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "@pingtome/ui";
import {
  Plus,
  Key,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Webhook,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { format } from "date-fns";

interface ApiKeyData {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

const developerNavItems = [
  { title: "API Keys", href: "/dashboard/developer/api-keys", icon: Key, active: true },
  { title: "Webhooks", href: "/dashboard/developer/webhooks", icon: Webhook },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // New key display
  const [newKey, setNewKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await apiRequest("/developer/api-keys");
      setApiKeys(res || []);
    } catch (error) {
      console.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const res = await apiRequest("/developer/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName }),
      });

      setNewKey(res.key);
      setShowNewKey(true);
      setNewKeyName("");
      setCreateDialogOpen(false);
      fetchApiKeys();
    } catch (error) {
      alert("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/developer/api-keys/${id}`, { method: "DELETE" });
      fetchApiKeys();
    } catch (error) {
      alert("Failed to revoke API key");
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Developer
          </h1>
          <p className="text-slate-500 mt-1">
            Manage API access and integrations.
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
                  {item.title}
                  {!item.active && <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Create Button & Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
                <p className="text-sm text-slate-500">
                  Create and manage API keys for programmatic access.
                </p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    <Plus className="h-4 w-4" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                          Give your key a name to identify it later.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700">Key Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Production Server, Mobile App"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      className="rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !newKeyName.trim()}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {creating ? "Creating..." : "Create Key"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* New Key Display */}
            {showNewKey && (
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-800">API Key Created!</CardTitle>
                      <CardDescription className="text-emerald-600">
                        Copy this key now. You won&apos;t be able to see it again!
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-200">
                    <code className="flex-1 font-mono text-sm text-slate-800 break-all">
                      {newKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(newKey)}
                      className={`rounded-lg shrink-0 ${copied ? "bg-emerald-50 border-emerald-200 text-emerald-600" : ""}`}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                    onClick={() => setShowNewKey(false)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I&apos;ve copied my key
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* API Keys Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Your API Keys</CardTitle>
                    <CardDescription>Use these keys to authenticate API requests.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {apiKeys.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold">Last Used</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id} className="hover:bg-slate-50/50">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Key className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{key.name}</p>
                                <p className="text-xs text-slate-500">pk_live_••••••••</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {format(new Date(key.createdAt), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {key.lastUsedAt ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-0">
                                {format(new Date(key.lastUsedAt), "MMM d, yyyy")}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0">
                                Never used
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              onClick={() => handleRevoke(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-16 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Key className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">No API keys yet</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Create an API key to start using the API programmatically.
                    </p>
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Code className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                    <CardDescription>Get started with the PingTO.Me API.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Authentication */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Authentication</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Include your API key in the{" "}
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code>{" "}
                        header with each request.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code Example */}
                <div className="relative">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium">cURL</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                      onClick={() => handleCopy('curl -X GET "https://api.pingto.me/links" -H "x-api-key: YOUR_API_KEY"')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <pre className="bg-slate-800 p-4 rounded-b-lg overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">
                      curl -X GET &quot;https://api.pingto.me/links&quot; \{"\n"}
                      {"  "}-H &quot;x-api-key: YOUR_API_KEY&quot;
                    </code>
                  </pre>
                </div>

                {/* Docs Link */}
                <Link href="/docs" className="block">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <Code className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">API Documentation</p>
                        <p className="text-sm text-slate-500">
                          View full API reference and examples
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
