"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/components/animation/gsap";

const FACTORS = [
  { id: "route", title: "ROUTE", desc: "Does the existing route move toward the destination?", x: 150, y: 100 },
  { id: "capacity", title: "CAPACITY", desc: "Can the vehicle safely carry the shipment?", x: 150, y: 300 },
  { id: "hubs", title: "HUBS", desc: "Can it be transferred through compatible hubs?", x: 400, y: 50 },
  { id: "deadline", title: "DEADLINE", desc: "Can it arrive before its deadline?", x: 650, y: 100 },
  { id: "cost", title: "COST", desc: "What additional recovery cost is created?", x: 650, y: 300 },
  { id: "priority", title: "PRIORITY", desc: "How important is this shipment?", x: 400, y: 350 },
];

export function HowItThinks() {
  const containerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<SVGPathElement>("[data-think-line]");
      const nodes = gsap.utils.toArray<SVGGElement>("[data-think-node]");
      const center = document.querySelectorAll("[data-think-center]");

      gsap.set(lines, { strokeDasharray: 300, strokeDashoffset: 300 });
      gsap.set(nodes, { opacity: 0, scale: 0.8, transformOrigin: "center" });
      gsap.set(center, { opacity: 0, scale: 0.5, transformOrigin: "center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          end: "bottom 80%",
          scrub: true,
        },
      });

      tl.to(nodes, { opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "power1.inOut" })
        .to(lines, { strokeDashoffset: 0, duration: 1, stagger: 0.1, ease: "power1.inOut" }, "-=0.5")
        .to(center, { opacity: 1, scale: 1, duration: 1, ease: "power1.inOut" }, "-=0.5");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="intelligence" ref={containerRef} className="py-24 md:py-32 bg-background px-5 sm:px-8 md:px-10 lg:px-14 border-b border-border/50">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 md:mb-16 text-center">
          <h2 className="text-[clamp(2rem,5vw,4rem)] leading-tight font-medium tracking-tight text-foreground">
            How Piggyback Thinks
          </h2>
          <p className="text-lg text-muted mt-4 max-w-2xl mx-auto">
            Six decision factors evaluated in milliseconds to find the optimal recovery strategy.
          </p>
        </header>

        {/* Desktop Composition */}
        <div className="relative w-full hidden md:block">
          <svg viewBox="0 0 800 400" className="w-full h-auto" role="img">
            {/* Connection Lines */}
            {FACTORS.map((f, i) => (
              <path
                key={`line-${i}`}
                data-think-line
                d={`M ${f.x} ${f.y} L 400 200`}
                stroke="var(--border)"
                strokeWidth="2"
                fill="none"
              />
            ))}

            {/* Nodes */}
            {FACTORS.map((f, i) => (
              <g key={`node-${i}`} data-think-node transform={`translate(${f.x} ${f.y})`}>
                <circle cx="0" cy="0" r="40" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="12" fill="var(--foreground)" className="font-mono font-bold tracking-wider">{f.title}</text>
              </g>
            ))}

            {/* Center Decision Node */}
            <g data-think-center transform="translate(400 200)">
              <circle cx="0" cy="0" r="50" fill="var(--accent)" />
              <text y="-5" textAnchor="middle" fontSize="14" fill="var(--surface)" className="font-mono font-bold">RECOVERY</text>
              <text y="15" textAnchor="middle" fontSize="14" fill="var(--surface)" className="font-mono font-bold">DECISION</text>
            </g>
          </svg>
        </div>

        {/* Mobile Composition */}
        <div className="relative w-full md:hidden">
          <svg viewBox="0 0 320 600" className="w-full h-auto" role="img">
            {/* Connection Lines */}
            {[
              {x: 160, y: 50}, {x: 160, y: 130}, {x: 160, y: 210}, 
              {x: 160, y: 390}, {x: 160, y: 470}, {x: 160, y: 550}
            ].map((p, i) => (
              <path
                key={`m-line-${i}`}
                data-think-line
                d={`M ${p.x} ${p.y} L 160 300`}
                stroke="var(--border)"
                strokeWidth="2"
                fill="none"
              />
            ))}

            {/* Top 3 Factors */}
            {FACTORS.slice(0, 3).map((f, i) => (
              <g key={`m-node-${i}`} data-think-node transform={`translate(160 ${50 + i * 80})`}>
                <circle cx="0" cy="0" r="30" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fill="var(--foreground)" className="font-mono font-bold tracking-wider">{f.title}</text>
              </g>
            ))}

            {/* Bottom 3 Factors */}
            {FACTORS.slice(3, 6).map((f, i) => (
              <g key={`m-node-${i + 3}`} data-think-node transform={`translate(160 ${390 + i * 80})`}>
                <circle cx="0" cy="0" r="30" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fill="var(--foreground)" className="font-mono font-bold tracking-wider">{f.title}</text>
              </g>
            ))}

            {/* Center Decision Node */}
            <g data-think-center transform="translate(160 300)">
              <circle cx="0" cy="0" r="45" fill="var(--accent)" />
              <text y="-5" textAnchor="middle" fontSize="12" fill="var(--surface)" className="font-mono font-bold">RECOVERY</text>
              <text y="12" textAnchor="middle" fontSize="12" fill="var(--surface)" className="font-mono font-bold">DECISION</text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
