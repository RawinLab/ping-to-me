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
} from "@pingtome/ui";
import {
  LayoutDashboard,
  Globe,
  Tags,
  Settings,
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
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { apiRequest } from "@/lib/api";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/50 hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">PingTO.Me</h2>
        </div>
        <nav className="px-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}

          {/* Settings Section */}
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
              Settings
            </p>
            <div className="mt-2 space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar with Notifications and User Menu */}
        <div className="flex justify-end items-center gap-4 p-4 border-b">
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Account
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/security">
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {children}
      </div>
    </div>
  );
}
