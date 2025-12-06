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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@pingtome/ui";
import { History, ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, LogIn, LogOut, Filter, X, Clock, Globe, Link2, Users, FileText } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CREATE: { label: "Create", color: "bg-emerald-100 text-emerald-700", icon: Plus },
  UPDATE: { label: "Update", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
  DELETE: { label: "Delete", color: "bg-red-100 text-red-700", icon: Trash2 },
  LOGIN: { label: "Login", color: "bg-purple-100 text-purple-700", icon: LogIn },
  LOGOUT: { label: "Logout", color: "bg-slate-100 text-slate-700", icon: LogOut },
};

const RESOURCE_CONFIG: Record<string, { label: string; icon: any }> = {
  User: { label: "User", icon: Users },
  Link: { label: "Link", icon: Link2 },
  Domain: { label: "Domain", icon: Globe },
  Organization: { label: "Organization", icon: Users },
  BioPage: { label: "Bio Page", icon: FileText },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceFilter, setResourceFilter] = useState<string>("");
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(page * limit));
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resource", resourceFilter);

      const res = await apiRequest(`/audit/logs?${params.toString()}`);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = actionFilter || resourceFilter;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-slate-500 mt-1">
            Track all actions performed in your organization.
          </p>
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
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-48">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    {Object.entries(ACTION_CONFIG).map(([key, config]) => {
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
              <div className="w-48">
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Resources</SelectItem>
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
              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionFilter("");
                    setResourceFilter("");
                    setPage(0);
                  }}
                  className="rounded-lg"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
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
                    {loading ? "Loading..." : `Showing ${logs.length} of ${total} entries`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs()}
                className="rounded-lg"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
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
                    const actionConfig = ACTION_CONFIG[log.action] || { label: log.action, color: "bg-slate-100 text-slate-700", icon: History };
                    const ActionIcon = actionConfig.icon;
                    const resourceConfig = RESOURCE_CONFIG[log.resource] || { label: log.resource, icon: FileText };
                    const ResourceIcon = resourceConfig.icon;

                    return (
                      <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                        {/* Action Icon */}
                        <div className={`h-10 w-10 rounded-xl ${actionConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <ActionIcon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${actionConfig.color} border-0`}>
                              {actionConfig.label}
                            </Badge>
                            <span className="text-slate-400">•</span>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <ResourceIcon className="h-3.5 w-3.5" />
                              <span className="font-medium">{resourceConfig.label}</span>
                              {log.resourceId && (
                                <code className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {log.resourceId.substring(0, 8)}...
                                </code>
                              )}
                            </div>
                          </div>
                          {log.details && (
                            <p className="text-sm text-slate-500 truncate max-w-lg">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                            </span>
                            {log.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.ipAddress}
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
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
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
                  No audit logs yet
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Activity will appear here as actions are performed in your organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
