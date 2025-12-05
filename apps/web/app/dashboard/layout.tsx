"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  cn,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Input,
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
  ChevronRight,
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { apiRequest } from "@/lib/api";

const mainNavItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Links",
    href: "/dashboard/links",
    icon: Link2,
  },
  {
    title: "QR Codes",
    href: "/dashboard/qr-codes",
    icon: QrCode,
  },
  {
    title: "Bio Pages",
    href: "/dashboard/biopages",
    icon: FileText,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const manageItems = [
  {
    title: "Domains",
    href: "/dashboard/domains",
    icon: Globe,
  },
  {
    title: "Folders",
    href: "/dashboard/folders",
    icon: FolderOpen,
  },
  {
    title: "Organization",
    href: "/dashboard/organization",
    icon: Tags,
  },
];

const developerItems = [
  {
    title: "API Keys",
    href: "/dashboard/developer/api-keys",
    icon: Key,
  },
  {
    title: "Webhooks",
    href: "/dashboard/developer/webhooks",
    icon: Webhook,
  },
];

const settingsItems = [
  {
    title: "Profile",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    title: "Security",
    href: "/dashboard/settings/security",
    icon: Lock,
  },
  {
    title: "Two-Factor Auth",
    href: "/dashboard/settings/two-factor",
    icon: Shield,
  },
  {
    title: "Audit Logs",
    href: "/dashboard/settings/audit-logs",
    icon: History,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore errors
    }
    // Clear cookies client-side
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const NavSection = ({
    items,
    title,
  }: {
    items: typeof mainNavItems;
    title?: string;
  }) => (
    <div className="space-y-1">
      {title && (
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card hidden md:flex md:flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">PingTO.Me</span>
          </Link>
        </div>

        {/* Create Button */}
        <div className="p-4">
          <Link href="/dashboard/links/new">
            <Button className="w-full gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Create new
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <NavSection items={mainNavItems} />
          <NavSection items={manageItems} title="Manage" />
          <NavSection items={developerItems} title="Developer" />
        </nav>

        {/* Settings at bottom */}
        <div className="p-3 border-t">
          <Link
            href="/dashboard/settings/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              pathname.includes("/settings")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search links, QR codes, and more..."
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                    U
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings/profile"
                    className="flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings/security"
                    className="flex items-center"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/billing"
                    className="flex items-center"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
