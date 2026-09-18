"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Navigation, Search, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Showcase", icon: null },
    { href: "/control-tower", label: "Control Tower", icon: Navigation, badge: "Live" },
    { href: "/judge", label: "Judge Mode", icon: ShieldAlert, highlight: true },
    { href: "/track", label: "Track Cargo", icon: Search },
    { href: "/staff/dashboard", label: "Staff Ops", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center group">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold tracking-[0.25em] text-foreground">PIGGYBACK</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                MOSAIC
              </span>
            </div>
            <p className="text-[10px] text-muted hidden sm:block">Logistics Recovery Engine</p>
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-1 sm:gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-foreground text-background font-semibold shadow-sm"
                  : link.highlight
                  ? "text-amber-400 hover:bg-amber-400/10 border border-amber-400/30"
                  : "text-muted hover:text-foreground hover:bg-surface"
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
    </header>
  );
}
