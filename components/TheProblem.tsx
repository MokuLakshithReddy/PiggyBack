"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/components/animation/gsap";

// Canonical Scene Geometry (1200 x 700 viewBox)
const SCENE = {
  routeY: 400,
  routeStartX: 120,
  routeEndX: 1080,
  packageStart: { x: 380, y: 190 }, // Centered, prominent initial state
  truckStart: { x: 140, y: 336 },    // Resting on route (bottom of wheels at 336 + 64 = 400)
  hub: { x: 580, y: 400 },           // Transfer interchange node
  destination: { x: 1020, y: 400 },  // Chennai destination terminal
};

export function TheProblem() {
  const containerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Selectors
      const headlineFirst = ".tp-head-first";
      const headlineSecond = ".tp-head-second";
      const routeFaint = ".tp-route-faint";
      const routeActive = ".tp-route-active";
      const packageEl = ".tp-package-group";
      const truckEl = ".tp-truck-group";
      const hubEl = ".tp-hub-group";
      const destEl = ".tp-dest-group";
      const pkgStatusMisplaced = ".tp-pkg-status-misplaced";
      const pkgStatusLoaded = ".tp-pkg-status-loaded";
      const badgeStateAvail = ".tp-badge-state-avail";
      const badgeStateLoaded = ".tp-badge-state-loaded";
      const badgeBg = ".tp-badge-bg";
      const capacityBadge = ".tp-capacity-badge";

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(headlineFirst, { opacity: 0 });
        gsap.set(headlineSecond, { opacity: 1, y: 0 });
        gsap.set([routeActive, destEl, hubEl, truckEl], { opacity: 1 });
        gsap.set(routeFaint, { opacity: 0 });
        gsap.set(truckEl, { x: 760, y: SCENE.truckStart.y, opacity: 1 });
        gsap.set(packageEl, { x: 784, y: 324, scale: 0.58, opacity: 1 });
        gsap.set(capacityBadge, { y: -58 });
        gsap.set(badgeBg, { stroke: "var(--success, #2d8a4e)" });
        gsap.set(pkgStatusMisplaced, { opacity: 0 });
        gsap.set(pkgStatusLoaded, { opacity: 1 });
        gsap.set(badgeStateAvail, { opacity: 0 });
        gsap.set(badgeStateLoaded, { opacity: 1 });
        return;
      }

      // Initial state guaranteed at mount
      gsap.set([headlineSecond, routeActive, truckEl, hubEl, destEl, pkgStatusLoaded, badgeStateLoaded], { opacity: 0 });
      gsap.set([headlineFirst, pkgStatusMisplaced, badgeStateAvail], { opacity: 1, y: 0 });
      gsap.set(routeFaint, { opacity: 0.35 });
      gsap.set(badgeBg, { stroke: "var(--accent)" });

      // Ground package at canonical initial start coordinates
      gsap.set(packageEl, {
        x: SCENE.packageStart.x,
        y: SCENE.packageStart.y,
        opacity: 1,
        scale: 1,
        transformOrigin: "center center",
      });

      // Ground truck at canonical start
      gsap.set(truckEl, {
        x: SCENE.truckStart.x,
        y: SCENE.truckStart.y,
        opacity: 0,
      });

      gsap.set(capacityBadge, { y: -36 });

      // Master normalized scroll timeline (0 -> 1)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // ==========================================
      // STAGE 1: 0.00 -> 0.18 (MISPLACED SHIPMENT)
      // Package is solitary, prominent, and stranded.
      // ==========================================
      tl.to({}, { duration: 0.18 });

      // ==========================================
      // STAGE 2: 0.18 -> 0.38 (EXISTING ROUTE & DESTINATION)
      // Route reveals; headline crossfades to "Find one that's already moving."
      // ==========================================
      tl.to(headlineFirst, { opacity: 0, y: -16, duration: 0.1, ease: "power1.inOut" })
        .to(headlineSecond, { opacity: 1, y: 0, duration: 0.12, ease: "power1.inOut" }, "<0.05")
        .to(routeFaint, { opacity: 0, duration: 0.08 }, "<")
        .to(routeActive, { opacity: 1, duration: 0.12, ease: "power2.out" }, "<")
        .to(destEl, { opacity: 1, duration: 0.12 }, "<");

      // ==========================================
      // STAGE 3: 0.38 -> 0.55 (AVAILABLE CAPACITY)
      // Existing truck appears anchored to route with capacity badge
      // ==========================================
      tl.to(truckEl, { opacity: 1, duration: 0.15, ease: "power2.out" });

      // ==========================================
      // STAGE 4: 0.55 -> 0.70 (TRANSFER HUB & APPROACH)
      // Hub appears; truck approaches transfer hub
      // ==========================================
      tl.to(hubEl, { opacity: 1, duration: 0.12, ease: "power2.out" })
        .to(truckEl, {
          x: 310, // Front bumper reaches 310 + 194 = 504 (76px before hub at 580)
          duration: 0.15,
          ease: "power2.inOut",
        }, "<0.02");

      // ==========================================
      // STAGE 5: 0.70 -> 0.85 (RECOVERY MOVE: PIGGYBACK LOAD)
      // Misplaced package glides smoothly onto truck cargo deck & scales to fit
      // ==========================================
      tl.to(packageEl, {
        x: 334, // Sits squarely in truck's cargo deck
        y: 324, // Resting perfectly on the flatbed floor
        scale: 0.58,
        duration: 0.15,
        ease: "power2.inOut",
      })
      .to(capacityBadge, {
        y: -58, // Lifts gracefully above package with clear breathing space
        duration: 0.15,
        ease: "power2.out",
      }, "<")
      .to(badgeBg, { stroke: "var(--success, #2d8a4e)", duration: 0.08 }, "<")
      .to(badgeStateAvail, { opacity: 0, duration: 0.08 }, "<")
      .to(badgeStateLoaded, { opacity: 1, duration: 0.08 }, "<")
      .to(pkgStatusMisplaced, { opacity: 0, duration: 0.06 }, "<0.08")
      .to(pkgStatusLoaded, { opacity: 1, duration: 0.06 }, "<");

      // ==========================================
      // STAGE 6: 0.85 -> 1.00 (PIGGYBACK TRAVEL TO DESTINATION)
      // Package and truck travel together along route, stopping with clean 66px gap before Chennai Destination
      // ==========================================
      tl.to(truckEl, {
        x: 760, // Front bumper at 760 + 194 = 954 (66px before destination marker at 1020)
        duration: 0.15,
        ease: "power1.inOut",
      })
      .to(packageEl, {
        x: 784, // Travels in lockstep on the truck deck
        duration: 0.15,
        ease: "power1.inOut",
      }, "<");

      // Brief settling pause at 1.0
      tl.to({}, { duration: 0.05 });

    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="problem-section"
      className="relative h-[260vh] w-full bg-background border-b border-border/50"
    >
      {/* 100vh Sticky Visual Stage */}
      <div className="sticky top-0 flex h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 py-8">
        
        {/* Editorial Container: Tightly coupled headline + visual scene */}
        <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-6 md:gap-8">
          
          {/* Typography Area */}
          <div className="relative flex h-20 md:h-24 w-full items-center justify-center text-center shrink-0">
            <h2 className="tp-head-first absolute text-[clamp(2rem,4.5vw,4.25rem)] leading-tight font-medium tracking-tight text-foreground">
              Don&apos;t send another truck.
            </h2>
            <h2 className="tp-head-second absolute text-[clamp(2rem,4.5vw,4.25rem)] leading-tight font-medium tracking-tight text-foreground opacity-0 translate-y-3">
              Find one that&apos;s already moving.
            </h2>
          </div>

          {/* Canonical SVG Scene (1200 x 700) */}
          <div className="w-full relative shrink-0">
            <svg
              viewBox="0 0 1200 700"
              className="w-full h-auto drop-shadow-sm select-none"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Piggyback intelligent recovery sequence"
            >
              <defs>
                <filter id="pkgShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.08)" />
                </filter>
              </defs>

              {/* Faint Route Foundation */}
              <path
                className="tp-route-faint"
                d={`M ${SCENE.routeStartX} ${SCENE.routeY} L ${SCENE.routeEndX} ${SCENE.routeY}`}
                fill="none"
                stroke="var(--border)"
                strokeWidth="4"
                strokeDasharray="10 10"
              />

              {/* Active Route (Revealed in Stage 2) */}
              <path
                className="tp-route-active"
                d={`M ${SCENE.routeStartX} ${SCENE.routeY} L ${SCENE.routeEndX} ${SCENE.routeY}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Destination Marker at (1020, 400) - Label placed below route so it never overlaps truck or cargo */}
              <g className="tp-dest-group" transform={`translate(${SCENE.destination.x}, ${SCENE.destination.y})`}>
                <circle cx="0" cy="0" r="16" fill="var(--foreground)" />
                <circle cx="0" cy="0" r="5" fill="var(--background)" />
                <text
                  x="0"
                  y="42"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--muted)"
                  fontFamily="var(--font-geist-mono), monospace"
                  letterSpacing="0.18em"
                  fontWeight="bold"
                >
                  CHENNAI DESTINATION
                </text>
              </g>

              {/* Transfer Hub Station at (580, 400) - Clean circular interchange node matching Chennai Station */}
              <g className="tp-hub-group" transform={`translate(${SCENE.hub.x}, ${SCENE.hub.y})`}>
                <circle cx="0" cy="0" r="16" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3.5" />
                <circle cx="0" cy="0" r="6" fill="var(--accent)" />
                <text
                  x="0"
                  y="42"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--muted)"
                  fontFamily="var(--font-geist-mono), monospace"
                  letterSpacing="0.18em"
                  fontWeight="bold"
                >
                  TRANSFER HUB
                </text>
              </g>

              {/* Existing Truck on Route */}
              <g className="tp-truck-group">
                {/* Capacity Badge floating above truck */}
                <g className="tp-capacity-badge" transform="translate(10, -36)">
                  {/* Badge Container Pill */}
                  <rect
                    className="tp-badge-bg"
                    x="0"
                    y="0"
                    width="170"
                    height="28"
                    rx="14"
                    fill="var(--surface)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                  
                  {/* State 1: 180 KG AVAILABLE */}
                  <g className="tp-badge-state-avail">
                    <circle cx="16" cy="14" r="3.5" fill="var(--accent)" />
                    <text
                      x="28"
                      y="18"
                      fontSize="10"
                      fill="var(--accent)"
                      fontFamily="var(--font-geist-mono), monospace"
                      fontWeight="bold"
                      letterSpacing="0.08em"
                    >
                      180 KG AVAILABLE
                    </text>
                  </g>

                  {/* State 2: 42 KG LOADED • 138 KG REM */}
                  <g className="tp-badge-state-loaded" opacity="0">
                    <circle cx="16" cy="14" r="3.5" fill="var(--success, #2d8a4e)" />
                    <text
                      x="28"
                      y="18"
                      fontSize="9"
                      fill="var(--success, #2d8a4e)"
                      fontFamily="var(--font-geist-mono), monospace"
                      fontWeight="bold"
                      letterSpacing="0.04em"
                    >
                      42 KG LOADED • 138 KG REM
                    </text>
                  </g>
                </g>

                {/* Truck Flatbed Cargo Deck & Cab */}
                {/* Low bed base */}
                <rect
                  x="0"
                  y="38"
                  width="148"
                  height="14"
                  rx="3"
                  fill="var(--surface)"
                  stroke="var(--foreground)"
                  strokeWidth="3.5"
                />
                {/* Rear stop rail */}
                <rect x="0" y="24" width="8" height="20" rx="2" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
                {/* Cab rear headboard */}
                <rect x="142" y="14" width="8" height="30" rx="2" fill="var(--surface)" stroke="var(--foreground)" strokeWidth="2.5" />
                {/* Accent stripe on bed */}
                <rect x="8" y="43" width="134" height="4" fill="var(--accent)" opacity="0.75" />

                {/* Driver Cab */}
                <path
                  d="M 148 14 L 188 14 L 188 52 L 148 52 Z"
                  fill="var(--surface)"
                  stroke="var(--foreground)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <rect x="158" y="20" width="18" height="14" rx="2" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2" />
                {/* Front Bumper */}
                <rect x="188" y="40" width="6" height="12" rx="2" fill="var(--foreground)" />

                {/* Wheels */}
                <circle cx="28" cy="52" r="12" fill="var(--foreground)" />
                <circle cx="28" cy="52" r="4" fill="var(--surface)" />
                <circle cx="116" cy="52" r="12" fill="var(--foreground)" />
                <circle cx="116" cy="52" r="4" fill="var(--surface)" />
                <circle cx="170" cy="52" r="12" fill="var(--foreground)" />
                <circle cx="170" cy="52" r="4" fill="var(--surface)" />
              </g>

              {/* Misplaced Package */}
              <g className="tp-package-group" filter="url(#pkgShadow)">
                {/* Outer Box */}
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="90"
                  rx="10"
                  fill="var(--surface)"
                  stroke="var(--foreground)"
                  strokeWidth="3.5"
                />
                {/* Horizontal Sealing Tape */}
                <path d="M 0 45 L 130 45" stroke="var(--foreground)" strokeWidth="2.5" opacity="0.25" />
                
                {/* Accent Top Tape */}
                <rect x="35" y="0" width="60" height="12" fill="var(--accent)" />
                
                {/* Status Pill: MISPLACED */}
                <g className="tp-pkg-status-misplaced" transform="translate(15, 18)">
                  <rect x="0" y="0" width="100" height="22" rx="11" fill="var(--accent)" />
                  <text
                    x="50"
                    y="15"
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="var(--surface)"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontWeight="bold"
                    letterSpacing="0.14em"
                  >
                    MISPLACED
                  </text>
                </g>

                {/* Status Pill: LOADED (swapped on piggyback match) */}
                <g className="tp-pkg-status-loaded" transform="translate(15, 18)" opacity="0">
                  <rect x="0" y="0" width="100" height="22" rx="11" fill="var(--success, #2d8a4e)" />
                  <text
                    x="50"
                    y="15"
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="var(--surface)"
                    fontFamily="var(--font-geist-mono), monospace"
                    fontWeight="bold"
                    letterSpacing="0.14em"
                  >
                    LOADED ✓
                  </text>
                </g>

                {/* ID Label & Barcode */}
                <text
                  x="65"
                  y="65"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--foreground)"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                >
                  SHP-2048
                </text>
                {/* Barcode lines */}
                <g transform="translate(32, 72)" opacity="0.6">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="var(--foreground)" strokeWidth="2" />
                  <line x1="6" y1="0" x2="6" y2="8" stroke="var(--foreground)" strokeWidth="3" />
                  <line x1="14" y1="0" x2="14" y2="8" stroke="var(--foreground)" strokeWidth="1.5" />
                  <line x1="22" y1="0" x2="22" y2="8" stroke="var(--foreground)" strokeWidth="3" />
                  <line x1="32" y1="0" x2="32" y2="8" stroke="var(--foreground)" strokeWidth="2" />
                  <line x1="42" y1="0" x2="42" y2="8" stroke="var(--foreground)" strokeWidth="3.5" />
                  <line x1="52" y1="0" x2="52" y2="8" stroke="var(--foreground)" strokeWidth="2" />
                  <line x1="60" y1="0" x2="60" y2="8" stroke="var(--foreground)" strokeWidth="3" />
                  <line x1="66" y1="0" x2="66" y2="8" stroke="var(--foreground)" strokeWidth="2" />
                </g>
              </g>

            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
