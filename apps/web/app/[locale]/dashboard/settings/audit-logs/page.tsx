"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  ScrollArea,
} from "@pingtome/ui";
import {
  History,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  LogIn,
  LogOut,
  Filter,
  X,
  Clock,
  Globe,
  Link2,
  Users,
  FileText,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Key,
  CreditCard,
  Tag,
  FolderOpen,
  Shield,
  Settings,
  Mail,
  UserPlus,
  UserMinus,
  Edit,
  Calendar,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface AuditLogEntry {
  id: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status?: string;
  details?: Record<string, any>;
  changes?: { before?: Record<string, any>; after?: Record<string, any> };
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
  createdAt: string;
}

// Enhanced action config to support new action format like 'link.created'
const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  // Legacy actions
  CREATE: {
    label: "Create",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  UPDATE: {
    label: "Update",
    color: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
  },
  DELETE: { label: "Delete", color: "bg-red-100 text-red-700", icon: Trash2 },
  LOGIN: {
    label: "Login",
    color: "bg-purple-100 text-purple-700",
    icon: LogIn,
  },
  LOGOUT: {
    label: "Logout",
    color: "bg-slate-100 text-slate-700",
    icon: LogOut,
  },
  // New action format
  "link.created": {
    label: "Link Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  "link.updated": {
    label: "Link Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Edit,
  },
  "link.deleted": {
    label: "Link Deleted",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "link.archived": {
    label: "Link Archived",
    color: "bg-amber-100 text-amber-700",
    icon: FolderOpen,
  },
  "link.restored": {
    label: "Link Restored",
    color: "bg-green-100 text-green-700",
    icon: RefreshCw,
  },
  "link.bulk_created": {
    label: "Bulk Create",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  "link.bulk_deleted": {
    label: "Bulk Delete",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "domain.added": {
    label: "Domain Added",
    color: "bg-emerald-100 text-emerald-700",
    icon: Globe,
  },
  "domain.verified": {
    label: "Domain Verified",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  "domain.failed": {
    label: "Domain Failed",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  "domain.removed": {
    label: "Domain Removed",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "domain.ssl_updated": {
    label: "SSL Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Shield,
  },
  "member.invited": {
    label: "Member Invited",
    color: "bg-purple-100 text-purple-700",
    icon: UserPlus,
  },
  "member.joined": {
    label: "Member Joined",
    color: "bg-green-100 text-green-700",
    icon: Users,
  },
  "member.role_changed": {
    label: "Role Changed",
    color: "bg-blue-100 text-blue-700",
    icon: Shield,
  },
  "member.removed": {
    label: "Member Removed",
    color: "bg-red-100 text-red-700",
    icon: UserMinus,
  },
  "org.created": {
    label: "Org Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  "org.updated": {
    label: "Org Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Edit,
  },
  "org.settings_changed": {
    label: "Settings Changed",
    color: "bg-amber-100 text-amber-700",
    icon: Settings,
  },
  "org.deleted": {
    label: "Org Deleted",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "auth.login": {
    label: "Login",
    color: "bg-purple-100 text-purple-700",
    icon: LogIn,
  },
  "auth.logout": {
    label: "Logout",
    color: "bg-slate-100 text-slate-700",
    icon: LogOut,
  },
  "auth.failed_login": {
    label: "Failed Login",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  "auth.2fa_enabled": {
    label: "2FA Enabled",
    color: "bg-green-100 text-green-700",
    icon: Shield,
  },
  "auth.2fa_disabled": {
    label: "2FA Disabled",
    color: "bg-amber-100 text-amber-700",
    icon: Shield,
  },
  "auth.password_changed": {
    label: "Password Changed",
    color: "bg-blue-100 text-blue-700",
    icon: Key,
  },
  "auth.email_verified": {
    label: "Email Verified",
    color: "bg-green-100 text-green-700",
    icon: Mail,
  },
  "api_key.created": {
    label: "API Key Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Key,
  },
  "api_key.rotated": {
    label: "API Key Rotated",
    color: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
  },
  "api_key.revoked": {
    label: "API Key Revoked",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "billing.plan_changed": {
    label: "Plan Changed",
    color: "bg-purple-100 text-purple-700",
    icon: CreditCard,
  },
  "billing.subscription_cancelled": {
    label: "Subscription Cancelled",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  "campaign.created": {
    label: "Campaign Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  "campaign.updated": {
    label: "Campaign Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Edit,
  },
  "campaign.deleted": {
    label: "Campaign Deleted",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "tag.created": {
    label: "Tag Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Tag,
  },
  "tag.updated": {
    label: "Tag Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Edit,
  },
  "tag.deleted": {
    label: "Tag Deleted",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
  "biopage.created": {
    label: "Bio Page Created",
    color: "bg-emerald-100 text-emerald-700",
    icon: Plus,
  },
  "biopage.updated": {
    label: "Bio Page Updated",
    color: "bg-blue-100 text-blue-700",
    icon: Edit,
  },
  "biopage.deleted": {
    label: "Bio Page Deleted",
    color: "bg-red-100 text-red-700",
    icon: Trash2,
  },
};

const RESOURCE_CONFIG: Record<string, { label: string; icon: any }> = {
  User: { label: "User", icon: Users },
  Link: { label: "Link", icon: Link2 },
  Domain: { label: "Domain", icon: Globe },
  Organization: { label: "Organization", icon: Users },
  OrganizationMember: { label: "Member", icon: UserPlus },
  BioPage: { label: "Bio Page", icon: FileText },
  ApiKey: { label: "API Key", icon: Key },
  Campaign: { label: "Campaign", icon: FolderOpen },
  Tag: { label: "Tag", icon: Tag },
  Subscription: { label: "Subscription", icon: CreditCard },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  success: {
    label: "Success",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  failure: {
    label: "Failure",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

// Date range presets
const DATE_PRESETS = [
  { label: "Last 24 hours", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [datePreset, setDatePreset] = useState<number>(7); // Default to last 7 days
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const limit = 20;

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
    if (resourceFilter && resourceFilter !== "all") params.set("resource", resourceFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);

    // Handle date range
    if (datePreset > 0) {
      params.set("startDate", subDays(new Date(), datePreset).toISOString());
      params.set("endDate", new Date().toISOString());
    } else if (startDate) {
      params.set("startDate", new Date(startDate).toISOString());
      if (endDate) params.set("endDate", new Date(endDate).toISOString());
    }

    return params.toString();
  }, [
    page,
    actionFilter,
    resourceFilter,
    statusFilter,
    searchQuery,
    datePreset,
    startDate,
    endDate,
  ]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/audit/logs?${buildQueryParams()}`);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [
    actionFilter,
    resourceFilter,
    statusFilter,
    searchQuery,
    datePreset,
    startDate,
    endDate,
  ]);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
      if (resourceFilter && resourceFilter !== "all") params.set("resource", resourceFilter);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (datePreset > 0) {
        params.set("startDate", subDays(new Date(), datePreset).toISOString());
        params.set("endDate", new Date().toISOString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/audit/logs/export?${params.toString()}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format === "csv" ? "export.csv" : "export.json"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setActionFilter("all");
    setResourceFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setDatePreset(7);
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters =
    (actionFilter && actionFilter !== "all") ||
    (resourceFilter && resourceFilter !== "all") ||
    (statusFilter && statusFilter !== "all") ||
    searchQuery ||
    datePreset !== 7;

  // Get unique actions from logs for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  // Helper to get action config with fallback
  const getActionConfig = (action: string) => {
    return (
      ACTION_CONFIG[action] || {
        label: action.replace(".", " ").replace(/_/g, " "),
        color: "bg-slate-100 text-slate-700",
        icon: History,
      }
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="text-slate-500 mt-1">
              Track all actions performed in your organization.
            </p>
          </div>
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              disabled={exporting}
              className="rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Date Range Preset */}
                <div className="w-48">
                  <Select
                    value={String(datePreset)}
                    onValueChange={(v) => setDatePreset(Number(v))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_PRESETS.map((preset) => (
                        <SelectItem
                          key={preset.days}
                          value={String(preset.days)}
                        >
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Filter */}
                <div className="w-48">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {Object.entries(ACTION_CONFIG)
                        .slice(0, 20)
                        .map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource Filter */}
                <div className="w-48">
                  <Select
                    value={resourceFilter}
                    onValueChange={setResourceFilter}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {Object.entries(RESOURCE_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-lg"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <History className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Activity Log</CardTitle>
                  <CardDescription>
                    {loading
                      ? "Loading..."
                      : `Showing ${logs.length} of ${total} entries`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs()}
                className="rounded-lg"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-200 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : logs.length > 0 ? (
              <>
                <div className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const actionConfig = getActionConfig(log.action);
                    const ActionIcon = actionConfig.icon;
                    const resourceConfig = RESOURCE_CONFIG[log.resource] || {
                      label: log.resource,
                      icon: FileText,
                    };
                    const ResourceIcon = resourceConfig.icon;
                    const statusConfig = STATUS_CONFIG[log.status || "success"];

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Action Icon */}
                        <div
                          className={`h-10 w-10 rounded-xl ${actionConfig.color} flex items-center justify-center flex-shrink-0`}
                        >
                          <ActionIcon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={`${actionConfig.color} border-0`}>
                              {actionConfig.label}
                            </Badge>
                            <span className="text-slate-400">•</span>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <ResourceIcon className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {resourceConfig.label}
                              </span>
                              {log.resourceId && (
                                <code className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {log.resourceId.substring(0, 8)}...
                                </code>
                              )}
                            </div>
                            {log.status && log.status !== "success" && (
                              <>
                                <span className="text-slate-400">•</span>
                                <Badge
                                  className={`${statusConfig.color} border-0`}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </>
                            )}
                          </div>

                          {/* Details */}
                          {log.details &&
                            Object.keys(log.details).length > 0 && (
                              <p className="text-sm text-slate-500 truncate max-w-lg mb-1">
                                {Object.entries(log.details)
                                  .filter(([k]) => k !== "changes")
                                  .map(
                                    ([k, v]) =>
                                      `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`,
                                  )
                                  .join(" | ")}
                              </p>
                            )}

                          {/* Changes */}
                          {log.changes &&
                            (log.changes.before || log.changes.after) && (
                              <div className="text-xs text-slate-400 bg-slate-50 rounded px-2 py-1 mt-1 inline-block">
                                <span className="font-medium">Changes:</span>{" "}
                                {Object.keys(
                                  log.changes.after || log.changes.before || {},
                                ).join(", ")}
                              </div>
                            )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(
                                new Date(log.createdAt),
                                "MMM d, yyyy HH:mm:ss",
                              )}
                            </span>
                            {log.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.ipAddress}
                              </span>
                            )}
                            {log.geoLocation && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.geoLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
                  <p className="text-sm text-slate-500">
                    Page {page + 1} of {totalPages || 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(Math.min(totalPages - 1, page + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="rounded-lg"
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                  <History className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No audit logs found
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {hasFilters
                    ? "Try adjusting your filters to see more results."
                    : "Activity will appear here as actions are performed in your organization."}
                </p>
                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLog && (() => {
            const actionConfig = getActionConfig(selectedLog.action);
            const ActionIcon = actionConfig.icon;
            const resourceConfig = RESOURCE_CONFIG[selectedLog.resource] || {
              label: selectedLog.resource,
              icon: FileText,
            };
            const ResourceIcon = resourceConfig.icon;
            const statusConfig = STATUS_CONFIG[selectedLog.status || "success"];

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${actionConfig.color} flex items-center justify-center`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold">Audit Log Details</div>
                      <div className="text-sm font-normal text-slate-500 mt-0.5">
                        {format(new Date(selectedLog.createdAt), "MMMM d, yyyy 'at' HH:mm:ss")}
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  {/* Action & Resource */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Action Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-slate-500">Action</span>
                        <Badge className={`${actionConfig.color} border-0`}>
                          {actionConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-slate-500">Resource Type</span>
                        <div className="flex items-center gap-1.5">
                          <ResourceIcon className="h-3.5 w-3.5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900">{resourceConfig.label}</span>
                        </div>
                      </div>
                      {selectedLog.resourceId && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">Resource ID</span>
                          <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono">
                            {selectedLog.resourceId}
                          </code>
                        </div>
                      )}
                      {selectedLog.status && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">Status</span>
                          <Badge className={`${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Network & Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Network Information</h3>
                    <div className="space-y-3">
                      {selectedLog.ipAddress && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">IP Address</span>
                          <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono">
                            {selectedLog.ipAddress}
                          </code>
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-500">User Agent</span>
                          <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono break-all">
                            {selectedLog.userAgent}
                          </code>
                        </div>
                      )}
                      {selectedLog.geoLocation && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">Location</span>
                          <span className="text-sm font-medium text-slate-900">{selectedLog.geoLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Changes */}
                  {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Changes</h3>
                        <div className="space-y-3">
                          {(() => {
                            const before = selectedLog.changes?.before || {};
                            const after = selectedLog.changes?.after || {};
                            const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

                            return Array.from(allKeys).map((key) => {
                              const beforeValue = before[key];
                              const afterValue = after[key];
                              const hasChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);

                              return (
                                <div key={key} className="bg-slate-50 rounded-lg p-3">
                                  <div className="text-xs font-semibold text-slate-700 mb-2">{key}</div>
                                  <div className="space-y-1">
                                    {beforeValue !== undefined && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs text-red-600 font-medium min-w-[50px]">Before:</span>
                                        <code className="text-xs text-slate-900 bg-white px-2 py-1 rounded flex-1 break-all">
                                          {typeof beforeValue === 'object' ? JSON.stringify(beforeValue, null, 2) : String(beforeValue)}
                                        </code>
                                      </div>
                                    )}
                                    {afterValue !== undefined && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs text-green-600 font-medium min-w-[50px]">After:</span>
                                        <code className="text-xs text-slate-900 bg-white px-2 py-1 rounded flex-1 break-all">
                                          {typeof afterValue === 'object' ? JSON.stringify(afterValue, null, 2) : String(afterValue)}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Additional Details */}
                  {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Additional Details</h3>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <pre className="text-xs text-slate-900 overflow-x-auto">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Metadata</h3>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-slate-500">Log ID</span>
                        <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono">
                          {selectedLog.id}
                        </code>
                      </div>
                      {selectedLog.userId && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">User ID</span>
                          <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono">
                            {selectedLog.userId}
                          </code>
                        </div>
                      )}
                      {selectedLog.organizationId && (
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-slate-500">Organization ID</span>
                          <code className="text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded font-mono">
                            {selectedLog.organizationId}
                          </code>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-slate-500">Timestamp</span>
                        <span className="text-sm font-medium text-slate-900">
                          {format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
