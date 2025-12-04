"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
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
import { CreditCard, Download, CheckCircle, ExternalLink } from "lucide-react";
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

export default function BillingPage() {
  const searchParams = useSearchParams();
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
    return <div className="p-8">Loading...</div>;
  }

  const planName =
    subscription?.plan?.charAt(0).toUpperCase() +
      subscription?.plan?.slice(1) || "Free";

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view billing history.
        </p>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">
            Your subscription has been updated successfully!
          </p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge
              variant={subscription?.plan === "free" ? "secondary" : "default"}
            >
              {planName}
            </Badge>
          </CardTitle>
          <CardDescription>
            {subscription?.status === "active"
              ? `Your subscription is active${subscription.expiresAt ? ` until ${format(new Date(subscription.expiresAt), "MMM d, yyyy")}` : ""}`
              : "You are on the free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <a href="/pricing">
              {subscription?.plan === "free" ? "Upgrade Plan" : "Change Plan"}
            </a>
          </Button>
          {subscription?.plan !== "free" && (
            <Button
              variant="outline"
              onClick={openBillingPortal}
              disabled={portalLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {portalLoading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {format(new Date(invoice.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      ${invoice.amount.toFixed(2)}{" "}
                      {invoice.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid" ? "default" : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.pdfUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No billing history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
