"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { securityApi } from "@/lib/api/security";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Textarea,
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
  ChevronDown,
  Info,
  Calendar as CalendarIcon,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface ApiKeyData {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
  ipWhitelist?: string[];
  rateLimit?: number;
  expiresAt?: string;
}

interface ScopeOption {
  value: string;
  label: string;
  description: string;
}

interface ScopesData {
  [resource: string]: {
    scopes: ScopeOption[];
  };
}

const developerNavItems = [
  {
    title: "API Keys",
    href: "/dashboard/developer/api-keys",
    icon: Key,
    active: true,
  },
  { title: "Webhooks", href: "/dashboard/developer/webhooks", icon: Webhook },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Scopes
  const [availableScopes, setAvailableScopes] = useState<ScopesData>({});
  const [loadingScopes, setLoadingScopes] = useState(true);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();

  // New key display
  const [newKey, setNewKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);

  // Rotation dialog
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [rotateKeyId, setRotateKeyId] = useState<string | null>(null);
  const [rotatePassword, setRotatePassword] = useState("");
  const [showRotatePassword, setShowRotatePassword] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotatedKey, setRotatedKey] = useState("");

  // Expiration dialog
  const [expirationDialogOpen, setExpirationDialogOpen] = useState(false);
  const [expirationKeyId, setExpirationKeyId] = useState<string | null>(null);
  const [newExpiration, setNewExpiration] = useState<Date | undefined>();
  const [updatingExpiration, setUpdatingExpiration] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    fetchScopes();
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

  const fetchScopes = async () => {
    try {
      const res = await apiRequest("/developer/api-keys/scopes");
      // Transform array response to grouped object format
      const grouped: ScopesData = {};
      if (Array.isArray(res)) {
        res.forEach((scope: { value: string; description: string; group: string }) => {
          const group = scope.group || 'Other';
          if (!grouped[group]) {
            grouped[group] = { scopes: [] };
          }
          // Format label from scope value (e.g., "link:read" -> "Read")
          const action = scope.value.split(':')[1] || scope.value;
          const label = action.charAt(0).toUpperCase() + action.slice(1);
          grouped[group].scopes.push({
            value: scope.value,
            label: label,
            description: scope.description,
          });
        });
      }
      setAvailableScopes(grouped);
    } catch (error) {
      console.error("Failed to fetch scopes");
    } finally {
      setLoadingScopes(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    if (selectedScopes.length === 0) {
      alert("Please select at least one scope");
      return;
    }

    setCreating(true);
    try {
      const body: any = {
        name: newKeyName,
        scopes: selectedScopes,
      };

      // Add optional fields if provided
      if (ipWhitelist.trim()) {
        body.ipWhitelist = ipWhitelist
          .split("\n")
          .map((ip) => ip.trim())
          .filter(Boolean);
      }
      if (rateLimit) {
        body.rateLimit = parseInt(rateLimit, 10);
      }
      if (expiresAt) {
        body.expiresAt = expiresAt.toISOString();
      }

      const res = await apiRequest("/developer/api-keys", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setNewKey(res.key);
      setShowNewKey(true);

      // Reset form
      setNewKeyName("");
      setSelectedScopes([]);
      setIpWhitelist("");
      setRateLimit("");
      setExpiresAt(undefined);
      setShowAdvanced(false);

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
        "Are you sure you want to revoke this API key? This action cannot be undone.",
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

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const handleRotateKey = async () => {
    if (!rotateKeyId || !rotatePassword) return;

    setRotating(true);
    try {
      const response = await securityApi.rotateApiKey(
        rotateKeyId,
        rotatePassword,
      );
      setRotatedKey(response.key);
      setRotateDialogOpen(false);
      setRotatePassword("");
      setShowRotatePassword(false);
      setShowNewKey(true);
      setNewKey(response.key);
      setRotateKeyId(null);
      fetchApiKeys();
    } catch (error: any) {
      alert(error.message || "Failed to rotate API key");
    } finally {
      setRotating(false);
    }
  };

  const handleUpdateExpiration = async () => {
    if (!expirationKeyId) return;

    setUpdatingExpiration(true);
    try {
      await securityApi.setApiKeyExpiration(
        expirationKeyId,
        newExpiration ? newExpiration.toISOString() : null,
      );
      setExpirationDialogOpen(false);
      setExpirationKeyId(null);
      setNewExpiration(undefined);
      fetchApiKeys();
    } catch (error: any) {
      alert(error.message || "Failed to update expiration");
    } finally {
      setUpdatingExpiration(false);
    }
  };

  const openRotateDialog = (keyId: string) => {
    setRotateKeyId(keyId);
    setRotateDialogOpen(true);
  };

  const openExpirationDialog = (keyId: string, currentExpiration?: string) => {
    setExpirationKeyId(keyId);
    setNewExpiration(currentExpiration ? new Date(currentExpiration) : undefined);
    setExpirationDialogOpen(true);
  };

  const isExpiringSoon = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    return days >= 0 && days <= 7;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const getScopeColor = (scope: string) => {
    if (scope === "admin") return "bg-red-100 text-red-700 border-red-200";
    if (scope.includes("delete"))
      return "bg-orange-100 text-orange-700 border-orange-200";
    if (scope.includes("create") || scope.includes("update"))
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (scope.includes("read"))
      return "bg-slate-100 text-slate-700 border-slate-200";
    return "bg-purple-100 text-purple-700 border-purple-200";
  };

  const getScopeLabel = (scope: string) => {
    return scope.replace(":", " ");
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
    <div className="p-6 lg:p-8 space-y-8">
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
                  {!item.active && (
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Create Button & Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  API Keys
                </h2>
                <p className="text-sm text-slate-500">
                  Create and manage API keys for programmatic access.
                </p>
              </div>
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    <Plus className="h-4 w-4" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                          Configure your API key with specific permissions and
                          settings.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Key Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-slate-700 font-medium"
                      >
                        Key Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Production Server, Mobile App"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="h-11 rounded-lg"
                      />
                    </div>

                    {/* Scopes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <Label className="text-slate-700 font-medium">
                          Permissions (Scopes)
                        </Label>
                      </div>
                      <p className="text-sm text-slate-500">
                        Select the permissions this API key should have. Choose
                        only what&apos;s needed.
                      </p>

                      {loadingScopes ? (
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">
                            Loading scopes...
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 border border-slate-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                          {Object.entries(availableScopes).map(
                            ([resource, { scopes }]) => (
                              <div key={resource} className="space-y-2">
                                <h4 className="font-semibold text-sm text-slate-700 capitalize border-b pb-1">
                                  {resource}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {scopes.map((scope) => (
                                    <TooltipProvider key={scope.value}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                            <Checkbox
                                              id={scope.value}
                                              checked={selectedScopes.includes(
                                                scope.value,
                                              )}
                                              onCheckedChange={() =>
                                                toggleScope(scope.value)
                                              }
                                              className={
                                                scope.value === "admin"
                                                  ? "border-red-500"
                                                  : ""
                                              }
                                            />
                                            <div className="flex-1">
                                              <label
                                                htmlFor={scope.value}
                                                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                                              >
                                                {scope.label}
                                                {scope.value === "admin" && (
                                                  <Badge className="ml-1 bg-red-100 text-red-700 border-0 text-xs">
                                                    Full Access
                                                  </Badge>
                                                )}
                                              </label>
                                            </div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="right"
                                          className="max-w-xs"
                                        >
                                          <p className="text-xs">
                                            {scope.description}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {selectedScopes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <span className="text-xs font-medium text-blue-700">
                            Selected:
                          </span>
                          {selectedScopes.map((scope) => (
                            <Badge
                              key={scope}
                              className={`text-xs border ${getScopeColor(scope)}`}
                            >
                              {getScopeLabel(scope)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advanced Settings */}
                    <Collapsible
                      open={showAdvanced}
                      onOpenChange={setShowAdvanced}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between rounded-lg hover:bg-slate-100"
                        >
                          <span className="text-sm font-medium">
                            Advanced Settings (Optional)
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        {/* IP Whitelist */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="ipWhitelist"
                            className="text-slate-700"
                          >
                            IP Whitelist
                          </Label>
                          <p className="text-xs text-slate-500">
                            Restrict API key usage to specific IP addresses (one
                            per line)
                          </p>
                          <Textarea
                            id="ipWhitelist"
                            placeholder="192.168.1.1&#10;10.0.0.1"
                            value={ipWhitelist}
                            onChange={(e) => setIpWhitelist(e.target.value)}
                            className="rounded-lg font-mono text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Rate Limit */}
                        <div className="space-y-2">
                          <Label htmlFor="rateLimit" className="text-slate-700">
                            Rate Limit (requests per minute)
                          </Label>
                          <Input
                            id="rateLimit"
                            type="number"
                            placeholder="e.g., 100"
                            value={rateLimit}
                            onChange={(e) => setRateLimit(e.target.value)}
                            className="h-11 rounded-lg"
                            min="1"
                          />
                        </div>

                        {/* Expiration Date */}
                        <div className="space-y-2">
                          <Label className="text-slate-700">
                            Expiration Date
                          </Label>
                          <p className="text-xs text-slate-500">
                            Set when this API key should automatically expire
                          </p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-11 rounded-lg"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expiresAt
                                  ? format(expiresAt, "PPP")
                                  : "No expiration"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={expiresAt}
                                onSelect={setExpiresAt}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {expiresAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpiresAt(undefined)}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              Clear expiration
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        setNewKeyName("");
                        setSelectedScopes([]);
                        setIpWhitelist("");
                        setRateLimit("");
                        setExpiresAt(undefined);
                        setShowAdvanced(false);
                      }}
                      className="rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        creating ||
                        !newKeyName.trim() ||
                        selectedScopes.length === 0
                      }
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
                      <CardTitle className="text-emerald-800">
                        API Key Created!
                      </CardTitle>
                      <CardDescription className="text-emerald-600">
                        Copy this key now. You won&apos;t be able to see it
                        again!
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
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
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
                    <CardDescription>
                      Use these keys to authenticate API requests.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {apiKeys.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Scopes</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">
                          Actions
                        </TableHead>
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
                                <p className="font-medium text-slate-900">
                                  {key.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  pk_live_••••••••
                                </p>
                                {key.expiresAt && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {isExpired(key.expiresAt) ? (
                                      <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                                        Expired
                                      </Badge>
                                    ) : isExpiringSoon(key.expiresAt) ? (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1">
                                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                                              <span className="text-xs text-orange-600">
                                                Expires{" "}
                                                {format(
                                                  new Date(key.expiresAt),
                                                  "MMM d",
                                                )}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">
                                              This key expires in{" "}
                                              {differenceInDays(
                                                new Date(key.expiresAt),
                                                new Date(),
                                              )}{" "}
                                              days
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ) : (
                                      <span className="text-xs text-slate-500">
                                        Expires{" "}
                                        {format(
                                          new Date(key.expiresAt),
                                          "MMM d, yyyy",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {key.scopes && key.scopes.length > 0 ? (
                                <>
                                  {key.scopes.slice(0, 3).map((scope) => (
                                    <Badge
                                      key={scope}
                                      className={`text-xs border ${getScopeColor(scope)}`}
                                    >
                                      {scope === "admin" ? (
                                        <span className="flex items-center gap-1">
                                          <Shield className="h-3 w-3" />
                                          Full Access
                                        </span>
                                      ) : (
                                        getScopeLabel(scope)
                                      )}
                                    </Badge>
                                  ))}
                                  {key.scopes.length > 3 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200 cursor-help">
                                            +{key.scopes.length - 3} more
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="flex flex-wrap gap-1">
                                            {key.scopes
                                              .slice(3)
                                              .map((scope) => (
                                                <Badge
                                                  key={scope}
                                                  className={`text-xs border ${getScopeColor(scope)}`}
                                                >
                                                  {getScopeLabel(scope)}
                                                </Badge>
                                              ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  No scopes
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {format(new Date(key.createdAt), "MMM d, yyyy")}
                              </div>
                              {key.lastUsedAt && (
                                <p className="text-xs text-slate-500">
                                  Last used:{" "}
                                  {format(new Date(key.lastUsedAt), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {key.lastUsedAt ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-0">
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-500 border-0"
                              >
                                Never used
                              </Badge>
                            )}
                            {key.ipWhitelist && key.ipWhitelist.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="ml-1 bg-blue-50 text-blue-700 border-0 text-xs cursor-help">
                                      IP Restricted
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-semibold mb-1">
                                      Allowed IPs:
                                    </p>
                                    <div className="space-y-0.5">
                                      {key.ipWhitelist.map((ip) => (
                                        <p
                                          key={ip}
                                          className="text-xs font-mono"
                                        >
                                          {ip}
                                        </p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {key.rateLimit && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="ml-1 bg-purple-50 text-purple-700 border-0 text-xs cursor-help">
                                      Rate Limited
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      {key.rateLimit} requests/minute
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                      onClick={() => openRotateDialog(key.id)}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Rotate API Key</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                                      onClick={() =>
                                        openExpirationDialog(key.id, key.expiresAt)
                                      }
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Set Expiration</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                      onClick={() => handleRevoke(key.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Revoke API Key</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                    <h3 className="font-medium text-slate-900 mb-1">
                      No API keys yet
                    </h3>
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
                    <CardDescription>
                      Get started with the PingTO.Me API.
                    </CardDescription>
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
                      <p className="font-medium text-blue-800">
                        Authentication
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Include your API key in the{" "}
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">
                          x-api-key
                        </code>{" "}
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
                      <span className="text-xs text-slate-400 font-medium">
                        cURL
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                      onClick={() =>
                        handleCopy(
                          'curl -X GET "https://api.pingto.me/links" -H "x-api-key: YOUR_API_KEY"',
                        )
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <pre className="bg-slate-800 p-4 rounded-b-lg overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">
                      curl -X GET &quot;https://api.pingto.me/links&quot; \
                      {"\n"}
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
                        <p className="font-medium text-slate-900">
                          API Documentation
                        </p>
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

      {/* Rotate API Key Dialog */}
      <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Rotate API Key
            </DialogTitle>
            <DialogDescription>
              Generate a new API key. The old key will be immediately revoked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Warning</p>
                <p className="text-sm text-amber-600">
                  This will invalidate your current API key. Update all
                  applications using this key immediately.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rotatePassword" className="text-slate-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="rotatePassword"
                  type={showRotatePassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={rotatePassword}
                  onChange={(e) => setRotatePassword(e.target.value)}
                  className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowRotatePassword(!showRotatePassword)}
                >
                  {showRotatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRotateDialogOpen(false);
                setRotatePassword("");
                setShowRotatePassword(false);
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRotateKey}
              disabled={rotating || !rotatePassword}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {rotating ? "Rotating..." : "Rotate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Expiration Dialog */}
      <Dialog open={expirationDialogOpen} onOpenChange={setExpirationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Set API Key Expiration
            </DialogTitle>
            <DialogDescription>
              Set when this API key should automatically expire and become invalid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 text-sm">Info</p>
                <p className="text-sm text-blue-600">
                  You can remove the expiration date to make the key valid
                  indefinitely.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Expiration Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-11 rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpiration
                      ? format(newExpiration, "PPP")
                      : "No expiration"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newExpiration}
                    onSelect={setNewExpiration}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {newExpiration && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewExpiration(undefined)}
                  className="text-xs text-slate-500 hover:text-slate-700 rounded-lg"
                >
                  Remove expiration
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setExpirationDialogOpen(false);
                setNewExpiration(undefined);
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateExpiration}
              disabled={updatingExpiration}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {updatingExpiration ? "Updating..." : "Update Expiration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
