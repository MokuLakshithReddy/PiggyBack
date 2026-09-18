"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PackageLoader } from "@/components/PackageLoader";
import { DEMO_CREDENTIALS } from "@/data/seed";
import { setAuthenticated } from "@/lib/store";

export default function StaffLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onLoaderComplete = useCallback(() => setLoading(false), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!staffId.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      if (staffId.trim() === DEMO_CREDENTIALS.staffId && password === DEMO_CREDENTIALS.password) {
        setAuthenticated(true);
        router.push("/staff/dashboard");
      } else {
        setError("Invalid credentials. Try: supervisor / piggyback2026");
        setSubmitting(false);
      }
    }, 600);
  };

  return (
    <>
      {loading && <PackageLoader variant="staff" onComplete={onLoaderComplete} />}

      <main className={`min-h-dvh bg-background flex flex-col transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-5 sm:px-8 md:px-10 lg:px-14 pt-6 pb-4">
          <Link href="/" className="font-mono text-xs font-bold tracking-[0.28em] text-foreground hover:text-accent transition-colors">
            PIGGYBACK
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted">OPERATIONS</span>
        </header>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-3">
                Piggyback Operations
              </h1>
              <p className="text-muted italic">&quot;Where shipments become routes.&quot;</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-3xl p-8 shadow-sm space-y-6">
              {/* Staff ID */}
              <div className="relative">
                <input
                  type="text"
                  id="staffId"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <label htmlFor="staffId" className="absolute left-4 top-2 text-[10px] font-mono tracking-wider text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] transition-all pointer-events-none">
                  STAFF ID
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <label htmlFor="password" className="absolute left-4 top-2 text-[10px] font-mono tracking-wider text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] transition-all pointer-events-none">
                  PASSWORD
                </label>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-error text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background py-4 rounded-xl font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Signing in..." : "Enter Operations →"}
              </button>

              <p className="text-center text-xs text-muted">
                Demo: <span className="font-mono text-foreground/60">supervisor</span> / <span className="font-mono text-foreground/60">piggyback2026</span>
              </p>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
