"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@pingtome/ui";
import { Plus, Trash, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { AddDomainModal } from "@/components/domains/AddDomainModal";

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Mock orgId for now, in real app get from context/auth
  const orgId = "123e4567-e89b-12d3-a456-426614174000";

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      // In a real app, we'd get the orgId from the user's session or context
      // For MVP, we might need to fetch the user's org first or just list all if the API supports it
      // Based on my controller implementation: GET /domains?orgId=...
      // I'll assume I can pass a dummy one or the backend handles it if I don't pass it (if I fix the controller)
      // But let's try to get it right.
      const res = await apiRequest(`/domains?orgId=${orgId}`);
      setDomains(res);
    } catch (err) {
      console.error("Failed to load domains", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;
    try {
      await apiRequest(`/domains/${id}`, { method: "DELETE" });
      fetchDomains();
    } catch (err) {
      alert("Failed to delete domain");
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await apiRequest(`/domains/${id}/verify`, { method: "POST" });
      alert("Verification triggered");
      fetchDomains();
    } catch (err) {
      alert("Verification failed");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground">
            Connect your own domains to brand your short links.
          </p>
        </div>
        <AddDomainModal orgId={orgId} onSuccess={fetchDomains}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Domain
          </Button>
        </AddDomainModal>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>
            Manage the domains associated with your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No domains found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
              {domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">
                    {domain.hostname}
                  </TableCell>
                  <TableCell>
                    {domain.isVerified ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <RefreshCw className="mr-1 h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(domain.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!domain.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(domain.id)}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(domain.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
