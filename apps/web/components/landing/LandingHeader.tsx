"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@pingtome/ui";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Integrations", href: "#integrations" },
  { name: "FAQ", href: "#faq" },
];

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">
              PingTO<span className="text-blue-600">.Me</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                href={item.href}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <UserMenu />
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-lg transition-colors"
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  className="w-full font-medium gradient-bg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="font-medium">
            Dashboard
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => logout()}
          className="font-medium"
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm" className="font-medium">
          Log in
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm" className="font-medium gradient-bg">
          Get Started Free
        </Button>
      </Link>
    </>
  );
}
