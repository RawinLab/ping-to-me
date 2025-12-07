"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UsageDashboard, UsageAlerts } from "@/components/billing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@pingtome/ui";
import {
  CreditCard,
  Download,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Link2,
  BarChart3,
  Globe,
  Users,
  ArrowUpRight,
  Receipt,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  plan: string;
  status: string;
  expiresAt?: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
}

const planFeatures = {
  free: [
    { label: "50 links/month", icon: Link2 },
    { label: "Basic analytics", icon: BarChart3 },
    { label: "QR codes", icon: Zap },
  ],
  pro: [
    { label: "Unlimited links", icon: Link2 },
    { label: "Advanced analytics", icon: BarChart3 },
    { label: "Custom domains", icon: Globe },
    { label: "Team members", icon: Users },
    { label: "Priority support", icon: Sparkles },
  ],
  enterprise: [
    { label: "Everything in Pro", icon: CheckCircle },
    { label: "SSO/SAML", icon: Users },
    { label: "Custom contracts", icon: Receipt },
    { label: "Dedicated support", icon: Sparkles },
  ],
};

function BillingContent() {
  const searchParams = useSearchParams();
  const { currentOrgId } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, historyRes] = await Promise.all([
        apiRequest("/payments/subscription"),
        apiRequest("/payments/billing-history").catch(() => []),
      ]);
      setSubscription(subRes);
      setInvoices(historyRes);
    } catch (error) {
      console.error("Failed to fetch billing data");
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await apiRequest("/payments/portal", {
        method: "POST",
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      alert("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading billing...</p>
        </div>
      </div>
    );
  }

  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : "Free";

  const currentPlan = (subscription?.plan ||
    "free") as keyof typeof planFeatures;
  const features = planFeatures[currentPlan] || planFeatures.free;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Billing & Subscription
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your plan, payment methods, and billing history.
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">
                Payment Successful!
              </p>
              <p className="text-sm text-emerald-600">
                Your subscription has been updated successfully.
              </p>
            </div>
          </div>
        )}

        {/* Usage Alerts */}
        {currentOrgId && <UsageAlerts organizationId={currentOrgId} />}

        {/* Current Plan Card */}
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    className={`px-3 py-1 text-sm font-semibold ${
                      subscription?.plan === "free"
                        ? "bg-slate-700 text-slate-200"
                        : subscription?.plan === "pro"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                          : "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0"
                    }`}
                  >
                    {planName} Plan
                  </Badge>
                  {subscription?.status === "active" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {subscription?.plan === "free"
                    ? "You're on the Free plan"
                    : `Your ${planName} subscription`}
                </h2>
                <p className="text-slate-400">
                  {subscription?.status === "active" && subscription.expiresAt
                    ? `Renews on ${format(new Date(subscription.expiresAt), "MMMM d, yyyy")}`
                    : subscription?.plan === "free"
                      ? "Upgrade to unlock more features"
                      : "Manage your subscription below"}
                </p>

                {/* Plan Features */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <span
                        key={feature.label}
                        className="flex items-center gap-1.5 text-sm text-slate-300 bg-white/10 px-3 py-1.5 rounded-full"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {feature.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/pricing">
                  <Button
                    className={`h-11 px-6 rounded-xl gap-2 ${
                      subscription?.plan === "free"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {subscription?.plan === "free"
                      ? "Upgrade to Pro"
                      : "Change Plan"}
                  </Button>
                </Link>
                {subscription?.plan !== "free" && (
                  <Button
                    variant="outline"
                    className="h-11 px-6 rounded-xl gap-2 border-slate-600 text-white hover:bg-white/10"
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                  >
                    <CreditCard className="h-4 w-4" />
                    {portalLoading ? "Loading..." : "Manage Billing"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Dashboard */}
        {currentOrgId && <UsageDashboard organizationId={currentOrgId} />}

        {/* Upgrade Promo (for free users) */}
        {subscription?.plan === "free" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                      Pro Plan
                      <ArrowUpRight className="h-4 w-4 text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Unlimited links, custom domains, and advanced analytics.
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      $9
                      <span className="text-sm font-normal text-slate-500">
                        /month
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                      Enterprise
                      <ArrowUpRight className="h-4 w-4 text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      SSO, dedicated support, and custom SLA for teams.
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      Contact Sales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing History */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>
                  View and download your past invoices.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      Invoice
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(new Date(invoice.date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-semibold">
                          ${invoice.amount.toFixed(2)}
                        </span>
                        <span className="text-slate-500 ml-1 text-xs">
                          {invoice.currency.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={
                            invoice.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-0"
                              : "bg-amber-50 text-amber-700 border-0"
                          }
                        >
                          {invoice.status === "paid" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            asChild
                          >
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">
                  No invoices yet
                </h3>
                <p className="text-sm text-slate-500">
                  Your billing history will appear here once you upgrade.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method (for paid users) */}
        {subscription?.plan !== "free" && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-500" />
                Payment Method
              </CardTitle>
              <CardDescription>Manage your payment details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-sm text-slate-500">Expires 12/25</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={openBillingPortal}
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading billing...</p>
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
