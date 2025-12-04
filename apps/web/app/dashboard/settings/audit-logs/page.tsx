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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@pingtome/ui";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
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

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all actions performed in your organization.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Resources</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Link">Link</SelectItem>
                  <SelectItem value="Domain">Domain</SelectItem>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="BioPage">Bio Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setActionFilter("");
                setResourceFilter("");
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Showing {logs.length} of {total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(
                          new Date(log.createdAt),
                          "MMM d, yyyy HH:mm:ss"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={ACTION_COLORS[log.action] || "bg-gray-100"}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-muted-foreground text-xs ml-2">
                            ({log.resourceId.substring(0, 8)}...)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No audit logs yet</h3>
              <p className="text-muted-foreground">
                Activity will appear here as actions are performed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
