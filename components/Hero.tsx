"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playHeroIntro } from "@/components/animation/hero-intro";
import { gsap } from "@/components/animation/gsap";
import { Search } from "lucide-react";

function LogisticsScene() {
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="A misplaced package in Hyderabad meeting a truck already bound for Chennai"
      className="h-auto w-full max-w-[20rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[36rem]"
    >
      <path
        data-hero-route
        d="M86 228 C 170 228, 214 152, 302 158 S 430 214, 492 204"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g data-hero-label>
        <circle cx="86" cy="228" r="5" fill="var(--foreground)" />
        <text x="86" y="258" textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="var(--font-geist-mono), ui-monospace, monospace" letterSpacing="0.18em">HYDERABAD</text>
      </g>
      <g data-hero-label>
        <circle cx="492" cy="204" r="5" fill="var(--foreground)" />
        <text x="492" y="234" textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="var(--font-geist-mono), ui-monospace, monospace" letterSpacing="0.18em">CHENNAI</text>
      </g>
      <g data-hero-package>
        <g transform="translate(58 186)">
          <rect x="0" y="10" width="40" height="30" rx="4" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="1.8" />
          <path d="M0 18 H40" stroke="var(--foreground)" strokeWidth="1.8" />
          <rect x="8" y="0" width="24" height="12" rx="2.5" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="1.8" />
          <rect x="0" y="22" width="40" height="5" fill="var(--accent)" />
        </g>
      </g>
      <g data-hero-truck>
        <g transform="translate(292 132)">
          <rect x="0" y="14" width="86" height="34" rx="5" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="1.8" />
          <path d="M86 22 H110 V48 H86 Z" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="92" y="26" width="12" height="10" rx="1.5" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.4" />
          <rect x="8" y="14" width="6" height="34" fill="var(--accent)" />
          <circle cx="22" cy="52" r="8" fill="var(--foreground)" />
          <circle cx="22" cy="52" r="3.2" fill="var(--surface)" />
          <circle cx="64" cy="52" r="8" fill="var(--foreground)" />
          <circle cx="64" cy="52" r="3.2" fill="var(--surface)" />
          <circle cx="100" cy="52" r="8" fill="var(--foreground)" />
          <circle cx="100" cy="52" r="3.2" fill="var(--surface)" />
        </g>
      </g>
      <text data-hero-status x="348" y="118" textAnchor="middle" fill="var(--accent)" fontSize="11" fontFamily="var(--font-geist-mono), ui-monospace, monospace" letterSpacing="0.12em">
        already going your way
      </text>
    </svg>
  );
}

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [trackInput, setTrackInput] = useState("");

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    // Run entrance choreography
    const introCleanup = playHeroIntro(root);

    // Run scroll-linked clean exit choreography
    const ctx = gsap.context(() => {
      const exitTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });

      // State 1: 0.0 -> 0.25 (Pristine Hero state, no exit movement)
      exitTimeline.to({}, { duration: 0.25 });

      // State 2: 0.25 -> 0.85 (Smooth, subtle resolution as user scrolls down)
      exitTimeline.to("[data-hero-exit-group]", {
        opacity: 0,
        y: -40,
        ease: "power2.inOut",
        duration: 0.6,
      });

      // State 3: 0.85 -> 1.0 (Completely resolved to 0 before TheProblem pins)
      exitTimeline.to({}, { duration: 0.15 });

    }, root);

    return () => {
      introCleanup?.();
      ctx.revert();
    };
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackInput.trim().toUpperCase();
    if (id) router.push(`/track?id=${encodeURIComponent(id)}`);
  };

  return (
    <section
      ref={rootRef}
      className="relative h-[135vh] w-full bg-background"
    >
      <div
        ref={stageRef}
        className="sticky top-0 flex h-dvh w-full flex-col justify-between overflow-hidden px-5 sm:px-8 md:px-10 lg:px-14 pb-8"
      >
        {/* Navigation */}
        <header className="flex w-full items-center justify-between pt-6 sm:pt-8 shrink-0 z-10">
          <p data-hero-nav className="font-mono text-[0.7rem] font-bold tracking-[0.28em] text-foreground sm:text-xs flex items-center gap-1.5">
            <span>PIGGYBACK</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">MOSAIC</span>
          </p>
          <nav data-hero-nav className="hidden md:flex items-center gap-6 text-xs text-muted">
            <a href="/control-tower" className="hover:text-foreground transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Control Tower
            </a>
            <a href="/judge" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Judge Mode
            </a>
            <a href="#problem-section" className="hover:text-foreground transition-colors">The Problem</a>
            <a href="#story-sequence" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#recovery-demo" className="hover:text-foreground transition-colors">Demo</a>
          </nav>
          <div data-hero-nav className="flex items-center gap-4">
            <a href="/track" className="text-xs sm:text-sm font-medium text-muted hover:text-foreground transition-colors">
              Track
            </a>
            <a
              href="/staff/dashboard"
              className="text-xs sm:text-sm font-medium text-accent hover:text-foreground transition-colors"
            >
              Staff Ops →
            </a>
          </div>
        </header>

        {/* Hero Content Group (Cleanly exits on scroll) */}
        <div data-hero-exit-group className="flex flex-1 flex-col gap-8 py-6 md:gap-10 md:py-8 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-center lg:gap-x-12 lg:gap-y-6">
          {/* Headline */}
          <h1
            data-hero-copy
            className="text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.96] font-medium tracking-tight text-foreground lg:col-span-2"
          >
            Your shipment got lost.
            <span className="mt-1 block">We find it a ride home.</span>
          </h1>

          {/* Left Column: Copy + Search */}
          <div className="flex min-w-0 flex-col justify-center">
            <p data-hero-copy className="max-w-sm text-base leading-relaxed text-muted md:text-lg">
              Track your shipment or discover how Piggyback matches misplaced cargo with routes already moving.
            </p>

            {/* Inline Track Input */}
            <form
              data-hero-copy
              onSubmit={handleTrack}
              className="mt-6 md:mt-8 flex items-center gap-0 max-w-md"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value)}
                  placeholder="Enter shipment ID, e.g. SHP-2048"
                  aria-label="Shipment ID"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border rounded-l-2xl text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <button
                type="submit"
                data-cursor="TRACK"
                className="px-6 py-3.5 bg-foreground text-background text-sm font-medium rounded-r-2xl hover:bg-accent transition-colors shrink-0"
              >
                Track →
              </button>
            </form>

            <a
              data-hero-copy
              href="#problem-section"
              className="mt-6 inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              See how Piggyback works ↓
            </a>
          </div>

          {/* Right Column: Illustration */}
          <div className="flex min-w-0 w-full items-center justify-center pb-4 md:justify-center lg:justify-end lg:pb-0">
            <LogisticsScene />
          </div>
        </div>

        {/* Scroll indicator prompt */}
        <div data-hero-copy className="flex items-center justify-between text-xs font-mono text-muted/60 pt-2 shrink-0 border-t border-border/40">
          <span>INTELLIGENT RECOVERY</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </div>
    </section>
  );
}
