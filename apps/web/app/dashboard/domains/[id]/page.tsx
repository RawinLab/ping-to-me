"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
} from "@pingtome/ui";
import {
  ArrowLeft,
  Globe,
  Shield,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Trash2,
  Star,
  Link2,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { SslStatusBadge } from "@/components/domains/SslStatusBadge";
import {
  domainsApi,
  Domain,
  DomainLink,
  DomainStatus,
} from "@/lib/api/domains";

export default function DomainDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const domainId = params?.id as string;

  const [domain, setDomain] = useState<Domain | null>(null);
  const [links, setLinks] = useState<DomainLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock orgId for now, in real app get from context/auth
  const orgId = "123e4567-e89b-12d3-a456-426614174000";

  useEffect(() => {
    if (domainId) {
      fetchDomain();
      fetchLinks();
    }
  }, [domainId, currentPage]);

  const fetchDomain = async () => {
    try {
      const res = await domainsApi.get(orgId, domainId);
      setDomain(res);
    } catch (err) {
      console.error("Failed to load domain", err);
      alert("Failed to load domain details");
      router.push("/dashboard/domains");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async () => {
    setLinksLoading(true);
    try {
      const res = await domainsApi.getLinks(orgId, domainId, {
        page: currentPage,
        limit: 10,
      });
      setLinks(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load links", err);
    } finally {
      setLinksLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!domain) return;
    setActionLoading(true);
    try {
      await domainsApi.verify(orgId, domainId, domain.verificationType);
      fetchDomain();
    } catch (err: any) {
      alert(err?.message || "Verification failed. Please check your DNS records.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProvisionSsl = async () => {
    setActionLoading(true);
    try {
      await domainsApi.provisionSsl(orgId, domainId);
      fetchDomain();
    } catch (err) {
      alert("Failed to provision SSL certificate");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoRenew = async (autoRenew: boolean) => {
    setActionLoading(true);
    try {
      await domainsApi.updateSsl(orgId, domainId, autoRenew);
      fetchDomain();
    } catch (err) {
      alert("Failed to update SSL settings");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!domain) return;
    if (!confirm(`Set ${domain.hostname} as your default domain?`)) return;
    setActionLoading(true);
    try {
      await domainsApi.setDefault(orgId, domainId);
      fetchDomain();
    } catch (err) {
      alert("Failed to set default domain");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!domain) return;
    if (
      !confirm(
        `Are you sure you want to delete ${domain.hostname}? This cannot be undone.`
      )
    )
      return;
    setActionLoading(true);
    try {
      await domainsApi.delete(orgId, domainId);
      router.push("/dashboard/domains");
    } catch (err) {
      alert("Failed to delete domain");
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: DomainStatus) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
            <Shield className="mr-1 h-3 w-3" /> Verified
          </Badge>
        );
      case "VERIFYING":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Verifying
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
            <AlertTriangle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
            <Clock className="mr-1 h-3 w-3" /> Pending Verification
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="h-48 bg-slate-100 rounded-xl" />
            <div className="h-48 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/domains")}
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {domain.hostname}
            </h1>
            <p className="text-slate-500 mt-1">Domain details and settings</p>
          </div>
        </div>

        {/* Domain Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                Domain Status
              </CardTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(domain.status)}
                {domain.isDefault && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                    <Star className="mr-1 h-3 w-3 fill-blue-700" /> Default
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Hostname</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm">{domain.hostname}</p>
                  <button
                    onClick={() => copyToClipboard(domain.hostname, "hostname")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedId === "hostname" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://${domain.hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Added</p>
                <p className="text-sm font-medium">
                  {format(new Date(domain.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {domain.lastVerifiedAt && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Last Verified</p>
                  <p className="text-sm font-medium">
                    {format(
                      new Date(domain.lastVerifiedAt),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              )}
              {domain.verificationAttempts > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Verification Attempts
                  </p>
                  <p className="text-sm font-medium">
                    {domain.verificationAttempts}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {!domain.isVerified && (
                <Button
                  onClick={handleVerify}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {domain.status === "FAILED" ? "Retry Verification" : "Verify Domain"}
                </Button>
              )}
              {domain.isVerified && !domain.isDefault && (
                <Button
                  onClick={handleSetDefault}
                  disabled={actionLoading}
                  variant="outline"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}
                  Set as Default
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Domain
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DNS Verification Card */}
        {!domain.isVerified && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5" />
                DNS Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Add one of the following DNS records to verify domain ownership:
              </p>

              {/* TXT Record Option */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    Option 1
                  </Badge>
                  <p className="text-sm font-medium">TXT Record (Recommended)</p>
                </div>
                {domain.verificationToken && (
                  <div className="bg-slate-50 rounded-lg border p-4 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                      <span>Type</span>
                      <span>Name</span>
                      <span>Value</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                      <span className="text-slate-700">TXT</span>
                      <span className="text-slate-900">_pingto-verify</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-blue-600 truncate">
                          {domain.verificationToken}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(domain.verificationToken!, "txt-token")
                          }
                          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                        >
                          {copiedId === "txt-token" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CNAME Record Option */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border-0">
                    Option 2
                  </Badge>
                  <p className="text-sm font-medium">CNAME Record</p>
                </div>
                <div className="bg-slate-50 rounded-lg border p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                    <span>Type</span>
                    <span>Name</span>
                    <span>Value</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                    <span className="text-slate-700">CNAME</span>
                    <span className="text-slate-900">{domain.hostname}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">redirect.pingto.me</span>
                      <button
                        onClick={() =>
                          copyToClipboard("redirect.pingto.me", "cname-target")
                        }
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {copiedId === "cname-target" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {domain.status === "FAILED" && domain.verificationError && (
                <div className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
                  <strong>Verification Failed:</strong> {domain.verificationError}
                </div>
              )}

              <div className="text-xs text-slate-500 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                <strong>Note:</strong> DNS changes can take up to 48 hours to
                propagate. After adding the record, click &quot;Verify Domain&quot; to check
                the status.
              </div>
            </CardContent>
          </Card>
        )}

        {/* SSL Certificate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              SSL Certificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SslStatusBadge
              status={domain.sslStatus}
              expiresAt={domain.sslExpiresAt}
              issuedAt={domain.sslIssuedAt}
              autoRenew={domain.sslAutoRenew}
              onProvisionSsl={handleProvisionSsl}
              onToggleAutoRenew={handleToggleAutoRenew}
              isVerified={domain.isVerified}
            />
          </CardContent>
        </Card>

        {/* Links Using This Domain */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Link2 className="h-5 w-5" />
                Links Using This Domain
              </CardTitle>
              <Badge variant="outline">{links.length} links</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-4">
                  No links are using this domain yet
                </p>
                <Button asChild>
                  <Link href="/dashboard/links/new">Create Link</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/links/${link.id}/analytics`}
                          className="font-mono text-sm font-medium text-blue-600 hover:underline truncate"
                        >
                          {domain.hostname}/{link.slug}
                        </Link>
                      </div>
                      {link.title && (
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {link.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {link.originalUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Badge
                        className={
                          link.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 border-0"
                            : "bg-slate-100 text-slate-700 border-0"
                        }
                      >
                        {link.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-lg"
                      >
                        <Link href={`/dashboard/links/${link.id}/analytics`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
