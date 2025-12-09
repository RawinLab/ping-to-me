"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, Progress, Badge, Button } from "@pingtome/ui";
import {
  Link2,
  Globe,
  QrCode,
  FileText,
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
} from "lucide-react";

export interface EmptyDashboardProps {
  hasLinks: boolean;
  hasDomain: boolean;
  hasQrCode: boolean;
  hasBioPage: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  completed: boolean;
  gradient: string;
  shadowColor: string;
  hoverColor: string;
}

export function EmptyDashboard({
  hasLinks,
  hasDomain,
  hasQrCode,
  hasBioPage,
}: EmptyDashboardProps) {
  const checklist: ChecklistItem[] = useMemo(
    () => [
      {
        id: "create-link",
        title: "Create your first link",
        description:
          "Shorten a URL with custom slug and start tracking clicks",
        icon: <Link2 className="h-5 w-5" />,
        link: "/dashboard/links/new",
        completed: hasLinks,
        gradient: "from-blue-500 to-blue-600",
        shadowColor: "shadow-blue-500/30",
        hoverColor: "hover:border-blue-300",
      },
      {
        id: "setup-domain",
        title: "Set up custom domain",
        description:
          "Use your own branded domain for professional short links",
        icon: <Globe className="h-5 w-5" />,
        link: "/dashboard/domains",
        completed: hasDomain,
        gradient: "from-emerald-500 to-teal-600",
        shadowColor: "shadow-emerald-500/30",
        hoverColor: "hover:border-emerald-300",
      },
      {
        id: "generate-qr",
        title: "Generate QR code",
        description: "Create branded QR codes with your logo and colors",
        icon: <QrCode className="h-5 w-5" />,
        link: "/dashboard/qr-codes",
        completed: hasQrCode,
        gradient: "from-indigo-500 to-purple-600",
        shadowColor: "shadow-indigo-500/30",
        hoverColor: "hover:border-indigo-300",
      },
      {
        id: "create-bio",
        title: "Create bio page",
        description: "Build your link-in-bio landing page with multiple links",
        icon: <FileText className="h-5 w-5" />,
        link: "/dashboard/bio",
        completed: hasBioPage,
        gradient: "from-cyan-500 to-blue-500",
        shadowColor: "shadow-cyan-500/30",
        hoverColor: "hover:border-cyan-300",
      },
    ],
    [hasLinks, hasDomain, hasQrCode, hasBioPage]
  );

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercentage = (completedCount / checklist.length) * 100;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Hero Section */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse delay-1000" />

          <CardContent className="relative p-8 lg:p-12">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="hidden md:flex h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 items-center justify-center shadow-2xl shadow-blue-500/50 animate-bounce-slow">
                <Sparkles className="h-10 w-10 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                    Welcome to PingTO.Me
                  </h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                    <Zap className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                </div>
                <p className="text-lg text-slate-300 mb-6 max-w-2xl">
                  Get started by completing the steps below to unlock the full
                  power of link shortening, analytics, and branded experiences.
                </p>

                {/* Progress Section */}
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">
                        Getting Started Progress
                      </span>
                      {completedCount === checklist.length && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">
                      {completedCount} / {checklist.length} completed
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className="h-3 bg-slate-700"
                  />
                  {completedCount === checklist.length && (
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Congratulations! You&apos;ve completed all setup steps
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Quick Start Checklist
            </h2>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
              {completedCount} of {checklist.length}
            </Badge>
          </div>

          <div className="grid gap-4">
            {checklist.map((item, index) => (
              <Link key={item.id} href={item.link} className="group block">
                <Card
                  className={`
                    border-2 transition-all duration-300 cursor-pointer
                    ${
                      item.completed
                        ? "border-slate-200 bg-slate-50/50"
                        : `border-slate-200 ${item.hoverColor} hover:shadow-lg hover:shadow-slate-200`
                    }
                  `}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`
                          flex-shrink-0 h-12 w-12 rounded-xl
                          bg-gradient-to-br ${item.gradient}
                          flex items-center justify-center
                          shadow-lg ${item.shadowColor}
                          ${!item.completed && "group-hover:scale-110"}
                          transition-transform duration-300
                          text-white
                        `}
                      >
                        {item.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3
                              className={`
                                font-semibold text-lg mb-1
                                ${
                                  item.completed
                                    ? "text-slate-500 line-through"
                                    : "text-slate-900 group-hover:text-blue-600"
                                }
                                transition-colors
                              `}
                            >
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {item.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          {!item.completed && (
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          )}
                        </div>

                        {/* Step indicator */}
                        {!item.completed && (
                          <div className="mt-3">
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 text-xs"
                            >
                              Step {index + 1}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Video Tutorial Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Video Thumbnail Placeholder */}
              <div className="w-full md:w-48 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-slate-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Play className="h-6 w-6 text-blue-600 ml-0.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    Watch Tutorial
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-900 mb-2">
                  New to PingTO.Me?
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Watch our quick start video to learn how to create your first
                  short link, customize it, and track analytics in under 3
                  minutes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg border-slate-200 hover:bg-slate-50"
                    asChild
                  >
                    <a
                      href="https://docs.pingto.me/getting-started"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Documentation
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg border-slate-200 hover:bg-slate-50"
                    asChild
                  >
                    <a
                      href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="h-4 w-4" />
                      Watch Video
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Need help getting started?
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Our support team is here to help you every step of the way.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white border-slate-200 hover:bg-slate-50"
                  asChild
                >
                  <a
                    href="mailto:support@pingto.me"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact Support
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
