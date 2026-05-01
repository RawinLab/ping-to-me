"use client";

import Link from "next/link";
import { Link2, BarChart3, Globe, Zap, Shield, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";

interface AuthSidebarProps {
  variant?: "default" | "security" | "success";
  title?: string;
  description?: string;
}

export function AuthSidebar({
  variant = "default",
  title,
  description,
}: AuthSidebarProps) {
  const t = useTranslations("auth.sidebar");

  return (
    <div className="relative hidden h-full flex-col bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white lg:flex overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Logo */}
      <div className="relative z-20 flex items-center gap-2 text-xl font-bold">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Link2 className="h-5 w-5" />
        </div>
        <Link href="/" className="hover:opacity-80 transition-opacity">
          {t("brand")}
        </Link>
      </div>

      {/* Main Illustration */}
      <div className="relative z-20 flex-1 flex items-center justify-center py-12">
        <AuthIllustration variant={variant} />
      </div>

      {/* Bottom Content */}
      <div className="relative z-20 space-y-4">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        {description && (
          <p className="text-blue-100 text-lg leading-relaxed">{description}</p>
        )}

        {!title && !description && (
          <>
            <h2 className="text-2xl font-bold">{t("defaultTitle")}</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              {t("defaultDescription")}
            </p>
          </>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <FeatureItem icon={BarChart3} text={t("featureAnalytics")} />
          <FeatureItem icon={Globe} text={t("featureDomains")} />
          <FeatureItem icon={Zap} text={t("featureFast")} />
          <FeatureItem icon={QrCode} text={t("featureQr")} />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-100">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function AuthIllustration({ variant }: { variant: string }) {
  const t = useTranslations("auth.sidebar.illustration");

  if (variant === "security") {
    return <SecurityIllustration t={t} />;
  }
  if (variant === "success") {
    return <SuccessIllustration t={t} />;
  }
  return <DefaultIllustration t={t} />;
}

function DefaultIllustration({ t }: { t: any }) {
  return (
    <div className="relative w-full max-w-md">
      {/* Main Card - URL Shortener */}
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
        {/* Browser-like header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 bg-white/10 rounded-full h-6 flex items-center px-3">
            <span className="text-xs text-white/60">pingto.me</span>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-white/40 mb-1">{t("originalUrl")}</div>
            <div className="text-sm text-white/80 truncate">
              https://example.com/very-long-url-that-needs-shortening
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-400/30">
            <div className="text-xs text-green-300 mb-1">{t("shortUrl")}</div>
            <div className="text-sm font-medium text-green-100 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              pingto.me/abc123
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
          <StatItem value="12.5K" label={t("clicks")} />
          <StatItem value="89" label={t("countries")} />
          <StatItem value="94%" label={t("mobile")} />
        </div>
      </div>

      {/* Floating Analytics Card */}
      <div className="absolute -right-4 top-8 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium">{t("analytics")}</span>
        </div>
        <div className="flex gap-1 items-end h-8">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-blue-400 to-green-400 rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Floating QR Card */}
      <div className="absolute -left-4 bottom-12 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium">{t("qrCode")}</span>
        </div>
        <div className="w-12 h-12 bg-white rounded-md p-1">
          <div className="w-full h-full grid grid-cols-5 gap-0.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  [0, 1, 2, 4, 5, 6, 10, 14, 15, 19, 20, 21, 22, 24].includes(i)
                    ? "bg-gray-900"
                    : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityIllustration({ t }: { t: any }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold">{t("secureAccess")}</h3>
          <p className="text-blue-100 text-sm">
            {t("secureDescription")}
          </p>
          <div className="flex gap-3 pt-2">
            <div className="px-3 py-1.5 rounded-full bg-white/10 text-xs">
              256-bit SSL
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/10 text-xs">
              2FA Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessIllustration({ t }: { t: any }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">{t("almostThere")}</h3>
          <p className="text-blue-100 text-sm">
            {t("almostDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
