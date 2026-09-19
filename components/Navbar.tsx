"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Navigation,
  Search,
  LayoutDashboard,
  Menu,
  X,
  Compass,
  Zap,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Showcase", icon: null },
    { href: "/control-tower", label: "Control Tower", icon: Navigation, badge: "Live" },
    { href: "/judge", label: "Judge Mode", icon: ShieldAlert, highlight: true },
    { href: "/track", label: "Track Cargo", icon: Search },
    { href: "/staff/dashboard", label: "Staff Ops", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/85 border-b border-border/70 px-4 sm:px-8 py-3.5">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.25em] text-foreground group-hover:text-accent transition-colors">
                  PIGGYBACK
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                  MOSAIC
                </span>
              </div>
              <p className="text-[10px] text-muted hidden sm:block">Logistics Recovery Engine</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-foreground text-background font-bold shadow-sm"
                    : link.highlight
                    ? "text-amber-500 hover:bg-amber-500/10 border border-amber-500/30 font-bold"
                    : "text-muted hover:text-foreground hover:bg-surface border border-transparent"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/track"
            className="p-2 rounded-xl bg-surface border border-border text-foreground text-xs font-semibold flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px]">Track</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:border-accent transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 mt-2 border-t border-border/80 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : link.highlight
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/25"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
