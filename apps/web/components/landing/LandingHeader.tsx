"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@pingtome/ui";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "Integrations", href: "#integrations" },
  { name: "FAQ", href: "#faq" },
];

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const targetId = href.replace("#", "");
      const element = document.getElementById(targetId);

      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }

      setMobileMenuOpen(false);
    },
    [],
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">
              PingTO<span className="text-blue-600">.Me</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <UserMenu />
        </div>

        <button
          className="lg:hidden p-2 -mr-2 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container py-4 space-y-4 border-t bg-white">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-lg transition-colors"
              >
                {item.name}
              </a>
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
                className="w-full font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="font-medium">
            Dashboard
          </Button>
        </Link>
        <Link href="/login">
          <Button size="sm" variant="outline" className="font-medium">
            Sign out
          </Button>
        </Link>
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
        <Button
          size="sm"
          className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
        >
          Get Started Free
        </Button>
      </Link>
    </>
  );
}
