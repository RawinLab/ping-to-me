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
  Badge,
} from "@pingtome/ui";
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  Globe,
  ExternalLink,
  Shield,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { AddDomainModal } from "@/components/domains/AddDomainModal";

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Mock orgId for now, in real app get from context/auth
  const orgId = "123e4567-e89b-12d3-a456-426614174000";

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-200 rounded w-72" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Custom Domains
            </h1>
            <p className="text-slate-500 mt-1">
              Connect your own domains to brand your short links.
            </p>
          </div>
          <AddDomainModal orgId={orgId} onSuccess={fetchDomains}>
            <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
              <Plus className="mr-2 h-4 w-4" /> Add Domain
            </Button>
          </AddDomainModal>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {domains.filter((d) => d.isVerified).length}
                  </p>
                  <p className="text-sm text-emerald-600">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {domains.filter((d) => !d.isVerified).length}
                  </p>
                  <p className="text-sm text-amber-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {domains.length}
                  </p>
                  <p className="text-sm text-blue-600">Total Domains</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domains List */}
        {domains.length === 0 ? (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No custom domains yet
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Add your own domain to create branded short links and improve
                  trust with your audience.
                </p>
                <AddDomainModal orgId={orgId} onSuccess={fetchDomains}>
                  <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Domain
                  </Button>
                </AddDomainModal>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <Card
                key={domain.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-5">
                    {/* Domain Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          domain.isVerified
                            ? "bg-gradient-to-br from-emerald-100 to-teal-100"
                            : "bg-gradient-to-br from-amber-100 to-orange-100"
                        }`}
                      >
                        {domain.isVerified ? (
                          <Shield className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {domain.hostname}
                          </h3>
                          <button
                            onClick={() =>
                              copyToClipboard(domain.hostname, domain.id)
                            }
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {copiedId === domain.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <a
                            href={`https://${domain.hostname}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>
                            Added{" "}
                            {format(new Date(domain.createdAt), "MMM d, yyyy")}
                          </span>
                          {domain.isVerified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                              <CheckCircle className="mr-1 h-3 w-3" /> Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                              <RefreshCw className="mr-1 h-3 w-3" /> Pending
                              Verification
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:ml-auto">
                      {!domain.isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(domain.id)}
                          className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Verify Now
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(domain.id)}
                        className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* DNS Instructions for Pending Domains */}
                  {!domain.isVerified && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        DNS Configuration Required
                      </p>
                      <p className="text-sm text-slate-500 mb-3">
                        Add the following CNAME record to your DNS settings:
                      </p>
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-3 font-mono text-sm">
                        <span className="text-slate-400">CNAME</span>
                        <span className="text-slate-900">
                          {domain.hostname}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-blue-600">
                          redirect.pingto.me
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              "redirect.pingto.me",
                              `cname-${domain.id}`,
                            )
                          }
                          className="ml-auto text-slate-400 hover:text-slate-600"
                        >
                          {copiedId === `cname-${domain.id}` ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pro Feature Promo */}
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Unlock More Custom Domains
                </h3>
                <p className="text-sm text-slate-600">
                  Upgrade to Pro to add unlimited custom domains and access
                  advanced DNS features like wildcard subdomains and SSL
                  management.
                </p>
              </div>
              <Button className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 whitespace-nowrap">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
