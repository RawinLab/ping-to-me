"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  cn,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Input,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@pingtome/ui";
import {
  LayoutDashboard,
  Globe,
  Tags,
  User,
  Lock,
  LogOut,
  ChevronDown,
  FolderOpen,
  CreditCard,
  Shield,
  Key,
  Webhook,
  History,
  Link2,
  QrCode,
  FileText,
  BarChart3,
  Plus,
  Search,
  Settings,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Moon,
  Sun,
  Command,
  Users,
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { apiRequest } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  description: string;
  requirePermission?: (
    permissions: ReturnType<typeof usePermission>,
  ) => boolean;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
}

const mainNavItems: NavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & quick actions",
  },
  {
    title: "Links",
    href: "/dashboard/links",
    icon: Link2,
    description: "Manage all your short links",
  },
  {
    title: "QR Codes",
    href: "/dashboard/qr-codes",
    icon: QrCode,
    description: "Create & customize QR codes",
  },
  {
    title: "Bio Pages",
    href: "/dashboard/bio",
    icon: FileText,
    description: "Your link-in-bio pages",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Track your performance",
  },
];

const manageItems: NavItem[] = [
  {
    title: "Domains",
    href: "/dashboard/domains",
    icon: Globe,
    description: "Custom branded domains",
    requirePermission: (p) => p.canManageDomains() || p.can("domain", "read"),
  },
  {
    title: "Folders",
    href: "/dashboard/folders",
    icon: FolderOpen,
    description: "Organize your links",
    requirePermission: (p) => p.isEditorOrAbove,
  },
  {
    title: "Team",
    href: "/dashboard/organization",
    icon: Users,
    description: "Team & workspace settings",
    requirePermission: (p) => p.isAdminOrAbove,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    description: "Subscription & invoices",
    requirePermission: (p) => p.canAccessBilling(),
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit",
    icon: History,
    description: "Security & activity logs",
    requirePermission: (p) => p.canAccessAudit(),
  },
];

const developerItems: NavItem[] = [
  {
    title: "API Keys",
    href: "/dashboard/developer/api-keys",
    icon: Key,
    description: "Manage API access",
    requirePermission: (p) => p.canCreateApiKey() || p.can("api-key", "read"),
  },
  {
    title: "Webhooks",
    href: "/dashboard/developer/webhooks",
    icon: Webhook,
    description: "Event notifications",
    requirePermission: (p) => p.isAdminOrAbove || p.can("webhook", "read"),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const permissions = usePermission();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Filter nav items based on permissions
  const filterNavItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.requirePermission) return true;
      return item.requirePermission(permissions);
    });
  };

  const filteredMainNavItems = filterNavItems(mainNavItems);
  const filteredManageItems = filterNavItems(manageItems);
  const filteredDeveloperItems = filterNavItems(developerItems);

  // Determine if an item should show a "View only" badge
  const getItemBadge = (item: NavItem): string | undefined => {
    if (item.href === "/dashboard/domains" && !permissions.canManageDomains()) {
      return "View only";
    }
    if (item.href === "/dashboard/billing" && !permissions.isOwner) {
      return "View only";
    }
    if (
      item.href === "/dashboard/developer/webhooks" &&
      !permissions.isAdminOrAbove
    ) {
      return "View only";
    }
    return undefined;
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore errors
    }
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const NavSection = ({
    items,
    title,
  }: {
    items: NavItem[];
    title?: string;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        {title && (
          <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {title}
          </p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const badge = getItemBadge(item);

          return (
            <TooltipProvider key={item.href} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] transition-transform group-hover:scale-110",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span className="truncate flex-1">{item.title}</span>
                    {badge && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-4 border-0",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-amber-50 text-amber-600",
                        )}
                      >
                        {badge}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  {badge && (
                    <p className="text-xs text-amber-600 mt-1">{badge}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                PingTO.Me
              </span>
              <Badge
                variant="secondary"
                className="ml-2 text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-0"
              >
                Beta
              </Badge>
            </div>
          </Link>
        </div>

        {/* Create Button */}
        {permissions.canCreateLink() && (
          <div className="p-4">
            <Link href="/dashboard/links/new">
              <Button className="w-full h-11 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 text-white font-medium rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                <Plus className="h-4 w-4" />
                Create new link
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <NavSection items={filteredMainNavItems} />
          <NavSection items={filteredManageItems} title="Manage" />
          <NavSection items={filteredDeveloperItems} title="Developer" />
        </nav>

        {/* Upgrade Banner */}
        <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-900">
              Upgrade to Pro
            </span>
          </div>
          <p className="text-xs text-violet-600 mb-3">
            Unlock custom domains, advanced analytics & more.
          </p>
          <Link href="/pricing">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-100"
            >
              View plans
            </Button>
          </Link>
        </div>

        {/* Settings at bottom */}
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/dashboard/settings/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              pathname.includes("/settings")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Settings className="h-[18px] w-[18px] text-slate-400" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div
              className={cn(
                "relative flex-1 transition-all duration-200",
                searchFocused && "scale-[1.02]",
              )}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search links, QR codes..."
                className={cn(
                  "pl-10 pr-12 h-10 bg-slate-50 border-slate-200 rounded-xl transition-all",
                  "focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-500 hover:text-slate-700"
                  >
                    <HelpCircle className="h-[18px] w-[18px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help & Support</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 hover:bg-slate-100 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-sm ring-2 ring-white shadow-sm">
                    U
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <p className="font-medium">My Account</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    user@example.com
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link
                    href="/dashboard/settings/profile"
                    className="flex items-center"
                  >
                    <User className="mr-2 h-4 w-4 text-slate-500" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link
                    href="/dashboard/settings/security"
                    className="flex items-center"
                  >
                    <Lock className="mr-2 h-4 w-4 text-slate-500" />
                    Security
                  </Link>
                </DropdownMenuItem>
                {permissions.canAccessBilling() && (
                  <DropdownMenuItem
                    asChild
                    className="rounded-lg cursor-pointer"
                  >
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center"
                    >
                      <CreditCard className="mr-2 h-4 w-4 text-slate-500" />
                      Billing
                      {!permissions.isOwner && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-0"
                        >
                          View only
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <EmailVerificationBanner />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
