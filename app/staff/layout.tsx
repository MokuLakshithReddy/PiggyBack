"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Box,
  Truck,
  Route,
  LogOut,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import { setAuthenticated } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/staff/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/control-tower", label: "Control Tower", icon: Navigation, badge: "Live" },
  { href: "/judge", label: "Judge Mode", icon: ShieldAlert, highlight: true },
  { href: "/staff/shipments", label: "Shipments", icon: Package },
  { href: "/staff/cargo", label: "Cargo", icon: Box },
  { href: "/staff/trucks", label: "Trucks", icon: Truck },
  { href: "/staff/routes", label: "Routes", icon: Route },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar for login page
  if (pathname === "/staff/login") return children;

  const handleLogout = () => {
    setAuthenticated(false);
    router.push("/");
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border shrink-0">
        <div className="p-6">
          <Link
            href="/"
            className="font-mono text-xs font-bold tracking-[0.25em] text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <span>PIGGYBACK</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">
              MOSAIC
            </span>
          </Link>
          <p className="font-mono text-[9px] tracking-[0.15em] text-muted mt-1">LOGISTICS OPS</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background font-semibold"
                    : item.highlight
                    ? "text-amber-400 hover:bg-amber-400/10"
                    : "text-muted hover:text-foreground hover:bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-accent">S</span>
            </div>
            <div>
              <p className="text-xs font-medium">Supervisor</p>
              <p className="text-[10px] text-muted font-mono">Online · Level 3 Dispatch</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full text-xs text-muted hover:text-rose-400 transition-colors rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-accent font-bold" : "text-muted"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
