"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/components/animation/gsap";

export function TheIdea() {
  const containerRef = useRef<HTMLElement>(null);
  
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const title = ".ti-title";
      const route = ".ti-route";
      const shipment = ".ti-shipment";
      const hub = ".ti-hub";
      const destination = ".ti-destination";
      const capacity = ".ti-capacity";

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set([title, route, shipment, hub, destination, capacity], { opacity: 1 });
        return;
      }

      // Initial deterministic state
      gsap.set([title, hub, destination, capacity], { opacity: 0 });
      gsap.set(shipment, { x: 220, y: 330, opacity: 0 });
      
      const routePath = document.querySelector(route) as SVGPathElement;
      let length = 1000;
      if (routePath) {
        length = routePath.getTotalLength();
        gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });

      // Step 1: title and shipment fade in
      tl.to(title, { opacity: 1, duration: 0.15, ease: "power1.inOut" })
        .to(shipment, { opacity: 1, duration: 0.15, ease: "power1.inOut" }, "<");

      // Step 2: route draws
      tl.to(route, { strokeDashoffset: 0, opacity: 0.8, duration: 0.25, ease: "power2.inOut" });

      // Step 3: transfer hub and capacity appear
      tl.to(hub, { opacity: 1, duration: 0.15, ease: "power1.inOut" }, "-=0.1")
        .to(capacity, { opacity: 1, duration: 0.15, ease: "power1.inOut" }, "<")
        .to(destination, { opacity: 1, duration: 0.15, ease: "power1.inOut" }, "<");

      // Step 4: shipment moves along route to hub at (600, 390)
      tl.to(shipment, { x: 600, y: 390, duration: 0.25, ease: "power1.inOut" });

      // Step 5: Capacity acknowledges match
      tl.to(capacity, { scale: 1.06, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" });

      // Step 6: shipment continues along route to destination at (1000, 330)
      tl.to(shipment, { x: 1000, y: 330, duration: 0.25, ease: "power1.inOut" });

      // Step 7: arrival confirmation
      tl.to(destination, { scale: 1.15, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" });

    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="idea" className="relative h-[175vh] bg-background border-y border-border w-full">
      <div className="sticky top-0 w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-4">
        
        {/* COMPOSITION CONTAINER */}
        <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-6 md:gap-8 relative">
          
          {/* Editorial Title */}
          <div className="relative flex items-center justify-center w-full text-center h-20 md:h-24 shrink-0 z-10">
            <h2 className="ti-title text-[clamp(2rem,4.5vw,4.25rem)] leading-tight font-medium tracking-tight text-foreground">
              The Idea
            </h2>
          </div>

          {/* Scaled SVG Scene (1200 x 700) */}
          <div className="w-full relative z-0 shrink-0">
            <svg
              viewBox="0 0 1200 700"
              className="w-full h-auto drop-shadow-sm select-none"
              role="img"
              aria-label="The Piggyback concept: joining an existing route"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Existing Route: Dips smoothly to Hub at (600,390) and continues to (1000,330) */}
              <path
                className="ti-route"
                d="M 200 330 C 380 330, 460 390, 600 390 C 740 390, 820 330, 1000 330"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0"
              />
              
              {/* Transfer Hub at (600, 390) */}
              <g className="ti-hub" transform="translate(600, 390)">
                <circle cx="0" cy="0" r="26" fill="var(--background)" stroke="var(--border)" strokeWidth="3.5" />
                <circle cx="0" cy="0" r="10" fill="var(--accent)" />
                <text
                  y="48"
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--muted)"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                >
                  TRANSFER HUB
                </text>
              </g>
              
              {/* Destination at (1000, 330) */}
              <g className="ti-destination" transform="translate(1000, 330)">
                <circle cx="0" cy="0" r="20" fill="var(--foreground)" />
                <circle cx="0" cy="0" r="7" fill="var(--background)" />
                <text
                  y="45"
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--muted)"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                >
                  DESTINATION
                </text>
              </g>

              {/* Available Capacity indicator anchored to route */}
              <g className="ti-capacity" transform="translate(800, 260)">
                <rect x="-95" y="-18" width="190" height="36" rx="18" fill="var(--accent)" />
                <text
                  y="5"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--accent-foreground, #FFFFFF)"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="bold"
                  letterSpacing="0.14em"
                >
                  AVAILABLE CAPACITY
                </text>
              </g>

              {/* Shipment (Grounded 70x50 package) */}
              <g className="ti-shipment">
                <rect
                  x="-35"
                  y="-25"
                  width="70"
                  height="50"
                  rx="6"
                  fill="var(--surface)"
                  stroke="var(--foreground)"
                  strokeWidth="3"
                />
                <path d="M -35 0 L 35 0" stroke="var(--foreground)" strokeWidth="2" opacity="0.3" />
                <rect x="-15" y="-25" width="30" height="8" fill="var(--accent)" />
                <text
                  x="0"
                  y="15"
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--foreground)"
                  fontFamily="var(--font-geist-mono), monospace"
                  fontWeight="bold"
                >
                  SHP-2048
                </text>
              </g>

            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
