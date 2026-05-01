"use client";

import Link from "next/link";
import { Button } from "@pingtome/ui";
import {
  ArrowRight,
  Play,
  Star,
  Link2,
  BarChart3,
  QrCode,
  Globe,
  Zap,
  MousePointerClick,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative px-4 md:px-6 py-20 md:py-28 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="inline-flex items-center gap-2 w-fit rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>{t("badge")}</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
                {t.rich("heading", {
                  highlight: (chunks) => (
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>
              <p className="max-w-[540px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  {t("startFree")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-semibold border-2 hover:bg-slate-50"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t("seeHowItWorks")}
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[
                    "from-blue-400 to-cyan-400",
                    "from-purple-400 to-pink-400",
                    "from-orange-400 to-red-400",
                    "from-green-400 to-emerald-400",
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${gradient} border-3 border-white shadow-md`}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold">{t("rating")}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("lovedByUsers")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Hero Illustration */}
          <div className="relative lg:ml-auto">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  const t = useTranslations("landing.hero.illustration");

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Main Dashboard Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-full border border-slate-200 text-xs text-slate-500">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              app.pingto.me
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-5">
          {/* URL Input */}
          <div className="relative">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <Link2 className="h-5 w-5 text-blue-600" />
              <input
                type="text"
                placeholder={t("placeholder")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                disabled
              />
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25">
                {t("shorten")}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={MousePointerClick}
              value="24.5K"
              label={t("totalClicks")}
              trend="+12%"
            />
            <StatCard
              icon={Link2}
              value="156"
              label={t("activeLinks")}
              trend="+8"
            />
            <StatCard icon={Globe} value="89" label={t("countries")} trend="+5" />
          </div>

          {/* Recent Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">
                {t("recentLinks")}
              </h4>
              <span className="text-xs text-blue-600 font-medium">
                {t("viewAll")}
              </span>
            </div>
            <div className="space-y-2">
              <LinkRow
                slug="pingto.me/launch"
                clicks="8,234"
                trend="+24%"
                color="blue"
              />
              <LinkRow
                slug="pingto.me/promo"
                clicks="5,127"
                trend="+18%"
                color="green"
              />
              <LinkRow
                slug="pingto.me/docs"
                clicks="3,891"
                trend="+9%"
                color="purple"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cards */}
      <FloatingAnalyticsCard />
      <FloatingQRCard />
      <FloatingNotificationCard />

      {/* Background Glow */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-full blur-3xl" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  trend,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  trend: string;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          <Icon className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <span className="text-xs text-green-600 font-medium">{trend}</span>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function LinkRow({
  slug,
  clicks,
  trend,
  color,
}: {
  slug: string;
  clicks: string;
  trend: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          <Link2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-700">{clicks}</span>
        <span className="text-xs text-green-600 font-medium">{trend}</span>
      </div>
    </div>
  );
}

function FloatingAnalyticsCard() {
  const t = useTranslations("landing.hero.illustration");

  return (
    <div className="absolute -right-4 md:-right-8 top-16 bg-white rounded-xl p-4 shadow-xl border border-slate-200/60 transform rotate-3 hover:rotate-0 transition-transform duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-100 rounded-lg">
          <BarChart3 className="h-4 w-4 text-green-600" />
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {t("clickAnalytics")}
        </span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
          <div
            key={i}
            className="w-4 bg-gradient-to-t from-green-500 to-emerald-400 rounded-sm transition-all hover:from-green-600 hover:to-emerald-500"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingQRCard() {
  const t = useTranslations("landing.hero.illustration");

  return (
    <div className="absolute -left-4 md:-left-8 bottom-24 bg-white rounded-xl p-4 shadow-xl border border-slate-200/60 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <QrCode className="h-4 w-4 text-purple-600" />
        </div>
        <span className="text-sm font-semibold text-slate-700">{t("qrCode")}</span>
      </div>
      <div className="w-16 h-16 bg-slate-100 rounded-lg p-2">
        <div className="w-full h-full grid grid-cols-6 gap-0.5">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-sm ${
                [
                  0, 1, 2, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 35,
                ].includes(i)
                  ? "bg-slate-800"
                  : [
                        7, 8, 9, 10, 13, 14, 15, 16, 19, 20, 21, 22, 25, 26, 27,
                        28,
                      ].includes(i)
                    ? "bg-slate-800/70"
                    : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingNotificationCard() {
  const t = useTranslations("landing.hero.illustration");

  return (
    <div className="absolute right-8 -bottom-4 bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-200/60 flex items-center gap-3 animate-bounce-slow">
      <div className="p-2 bg-green-100 rounded-full">
        <MousePointerClick className="h-4 w-4 text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{t("newClick")}</p>
        <p className="text-xs text-slate-500">pingto.me/launch - USA</p>
      </div>
    </div>
  );
}
