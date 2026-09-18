"use client";

import { useEffect, useState } from "react";
import { getRoutes } from "@/lib/store";
import type { DemoRoute } from "@/types";
import { Route, ArrowRight, MapPin } from "lucide-react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<DemoRoute[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoutes(getRoutes());
  }, []);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight">Routes</h1>
        <p className="text-sm text-muted mt-1">{routes.length} active routes · Demo data</p>
      </div>

      <div className="space-y-4">
        {routes.map(r => (
          <div key={r.id} className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                  <Route className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold">{r.id}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted" />
                    <span className="font-medium">{r.destination}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                r.status === "Active" ? "status-transit" :
                r.status === "Completed" ? "status-recovered" : "status-pending"
              }`}>{r.status.toUpperCase()}</span>
            </div>

            {/* Hubs */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {r.hubs.map((hub, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-medium">
                    <MapPin className="w-3 h-3 text-muted" />{hub}
                  </span>
                  {i < r.hubs.length - 1 && <ArrowRight className="w-3 h-3 text-border" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs pt-4 border-t border-border/50">
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">DISTANCE</p>
                <p className="font-medium">{r.distance} km</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">DURATION</p>
                <p className="font-medium">{Math.round(r.duration / 60)} hrs</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted tracking-wider mb-0.5">TRUCK</p>
                <p className="font-medium font-mono">{r.truckId ?? "Unassigned"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
