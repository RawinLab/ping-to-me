"use client";

import { Badge, Button } from "@pingtome/ui";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { SslStatus } from "@/lib/api/domains";
import { format, differenceInDays } from "date-fns";

interface SslStatusBadgeProps {
  status: SslStatus;
  expiresAt?: string;
  issuedAt?: string;
  autoRenew?: boolean;
  onProvisionSsl?: () => void;
  onToggleAutoRenew?: (enabled: boolean) => void;
  isVerified?: boolean;
  compact?: boolean;
}

export function SslStatusBadge({
  status,
  expiresAt,
  issuedAt,
  autoRenew = true,
  onProvisionSsl,
  onToggleAutoRenew,
  isVerified = false,
  compact = false,
}: SslStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "ACTIVE":
        return {
          icon: ShieldCheck,
          label: "SSL Active",
          className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
          iconClassName: "text-emerald-600",
        };
      case "PROVISIONING":
        return {
          icon: Loader2,
          label: "Provisioning SSL",
          className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
          iconClassName: "text-blue-600 animate-spin",
        };
      case "EXPIRED":
        return {
          icon: ShieldAlert,
          label: "SSL Expired",
          className: "bg-red-100 text-red-700 hover:bg-red-100",
          iconClassName: "text-red-600",
        };
      case "FAILED":
        return {
          icon: ShieldX,
          label: "SSL Failed",
          className: "bg-red-100 text-red-700 hover:bg-red-100",
          iconClassName: "text-red-600",
        };
      case "PENDING":
      default:
        return {
          icon: Shield,
          label: "SSL Pending",
          className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
          iconClassName: "text-slate-600",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Calculate days until expiry
  const daysUntilExpiry = expiresAt
    ? differenceInDays(new Date(expiresAt), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;

  if (compact) {
    return (
      <Badge className={`border-0 ${config.className}`}>
        <Icon className={`mr-1 h-3 w-3 ${config.iconClassName}`} />
        {config.label}
        {status === "ACTIVE" && expiresAt && (
          <span className="ml-1 text-xs opacity-75">
            ({daysUntilExpiry}d)
          </span>
        )}
      </Badge>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`border-0 ${config.className}`}>
            <Icon className={`mr-1 h-3 w-3 ${config.iconClassName}`} />
            {config.label}
          </Badge>
        </div>

        {/* Provision SSL button for verified domains without SSL */}
        {isVerified && status === "PENDING" && onProvisionSsl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onProvisionSsl}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Provision SSL
          </Button>
        )}

        {/* Retry button for failed SSL */}
        {status === "FAILED" && onProvisionSsl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onProvisionSsl}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry SSL
          </Button>
        )}
      </div>

      {/* SSL Certificate Details */}
      {status === "ACTIVE" && (issuedAt || expiresAt) && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Certificate Details</span>
            </div>
          </div>

          {issuedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Issued</span>
              <span className="text-slate-700 font-medium">
                {format(new Date(issuedAt), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {expiresAt && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Expires</span>
              <span
                className={`font-medium ${
                  isExpiringSoon ? "text-amber-700" : "text-slate-700"
                }`}
              >
                {format(new Date(expiresAt), "MMM d, yyyy")}
                {isExpiringSoon && (
                  <span className="ml-1 text-amber-600">
                    ({daysUntilExpiry} days)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Auto-renew toggle */}
          {onToggleAutoRenew && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-600">Auto-renew</span>
              <button
                onClick={() => onToggleAutoRenew(!autoRenew)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoRenew ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    autoRenew ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {isExpiringSoon && !autoRenew && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
              ⚠️ Certificate expiring soon. Enable auto-renew to prevent
              downtime.
            </div>
          )}
        </div>
      )}

      {/* SSL Failed Error Message */}
      {status === "FAILED" && (
        <div className="text-xs text-red-700 bg-red-50 rounded px-2 py-1.5 border border-red-200">
          SSL provisioning failed. This may be due to DNS propagation delays.
          Please retry in a few minutes.
        </div>
      )}

      {/* SSL Provisioning Message */}
      {status === "PROVISIONING" && (
        <div className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5 border border-blue-200">
          SSL certificate is being provisioned. This usually takes 5-10 minutes.
        </div>
      )}
    </div>
  );
}
