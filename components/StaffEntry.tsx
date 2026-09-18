"use client";

import { ArrowRight } from "lucide-react";

export function StaffEntry() {
  return (
    <section className="py-24 md:py-32 bg-background px-5 sm:px-8 md:px-10 lg:px-14 border-t border-border/50">
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-accent mb-4">OPERATIONS</p>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground mb-6">
          Managing shipments?
        </h2>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Piggyback Operations gives your team the tools to monitor recovery queues, manage cargo, assign trucks, and coordinate routes — all from one interface.
        </p>
        <a
          href="/staff/login"
          data-cursor="→"
          className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-accent transition-colors group"
        >
          Enter Operations
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
