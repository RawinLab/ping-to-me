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
} from "@pingtome/ui";
import { Plus, Key, Trash2, Copy, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ApiKeyData {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);

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
    alert("Copied to clipboard!");
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for programmatic access.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="My Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Display */}
      {showNewKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your New API Key
            </CardTitle>
            <CardDescription className="text-green-700">
              Copy this key now. You won&apos;t be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white p-3 rounded border font-mono text-sm break-all">
                {newKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(newKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="mt-4 text-green-700"
              onClick={() => setShowNewKey(false)}
            >
              I&apos;ve copied my key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Use these keys to authenticate API requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      {format(new Date(key.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? (
                        format(new Date(key.lastUsedAt), "MMM d, yyyy")
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(key.id)}
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
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">
                Create an API key to start using the API programmatically.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Learn how to use the API with your API key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Authentication</p>
              <p className="text-sm text-blue-600 mt-1">
                Include your API key in the{" "}
                <code className="bg-blue-100 px-1 rounded">x-api-key</code>{" "}
                header with each request.
              </p>
              <pre className="mt-2 bg-white p-2 rounded text-xs font-mono">
                curl -H &quot;x-api-key: YOUR_API_KEY&quot; https://api.pingto.me/links
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
