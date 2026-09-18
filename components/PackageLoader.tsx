"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/components/animation/gsap";

type PackageLoaderProps = {
  onComplete?: () => void;
  variant?: "default" | "staff" | "tracking";
};

// Physical Constants
const CONVEYOR_TOP_Y = 600;
const PACKAGE_WIDTH = 180;
const PACKAGE_HEIGHT = 120;
const PACKAGE_REST_TOP_Y = CONVEYOR_TOP_Y - PACKAGE_HEIGHT; // 480
const PKG_CENTER_X = 720; // Exact horizontal center of 1440 canvas
const PKG_CENTER_Y = 540; // Exact vertical center of package at rest (480 + 60)

export function PackageLoader({ onComplete, variant = "staff" }: PackageLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSkip = () => {
    setVisible(false);
    onComplete?.();
  };

  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;
    
    // Check reduced motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const cameraStage = cameraRef.current;
      const packageEl = ".pl-package";
      const shadowEl = ".pl-shadow";
      const conveyorBelt = ".pl-belt-rollers";
      const worldGroup = ".pl-world";
      const cloudLayer = ".pl-cloud-system";
      const cloudPuffs = ".pl-cloud-puff";

      // Camera initial state
      const cam = { scale: 1 };
      if (cameraStage) {
        cameraStage.setAttribute("transform", "translate(0, 0) scale(1)");
      }

      // Initial state: Package starts at Y=100 centered horizontally at 720 (left edge at 630)
      gsap.set(packageEl, {
        x: 630,
        y: 100,
        scaleX: 1,
        scaleY: 1,
        transformOrigin: "center bottom",
      });

      // Shadow on conveyor top surface (Y=600)
      gsap.set(shadowEl, {
        x: 630,
        y: CONVEYOR_TOP_Y,
        scale: 0.35,
        opacity: 0.15,
        transformOrigin: "center center",
      });

      gsap.set(conveyorBelt, { x: 0 });
      gsap.set(worldGroup, { x: 0 });

      // Package lid tape & internal glow
      gsap.set(".pl-pkg-tape", { y: 0, opacity: 1 });
      gsap.set(".pl-pkg-glow", { scale: 0.2, opacity: 0, transformOrigin: "center center" });

      // Volumetric cloud layer initialized right at package center (720, 540)
      gsap.set(cloudLayer, {
        opacity: 0,
        scale: 0.1,
        transformOrigin: `${PKG_CENTER_X}px ${PKG_CENTER_Y}px`,
      });

      gsap.set(cloudPuffs, {
        scale: 0.2,
        opacity: 0,
        transformOrigin: "center center",
      });

      // HTML Atmospheric mist layers (GPU-accelerated, dead-center anchored)
      gsap.set([".pl-html-mist-core", ".pl-html-mist-puff-left", ".pl-html-mist-puff-right"], {
        xPercent: -50,
        yPercent: -50,
        scale: 0.2,
        opacity: 0,
        force3D: true,
      });
      gsap.set(".pl-fog-veil", { opacity: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false);
          onComplete?.();
        },
      });

      // 1. Package falls from Y=100 and lands precisely on conveyor at Y=480 (0.00 -> 0.38s)
      tl.to(packageEl, {
        y: PACKAGE_REST_TOP_Y,
        duration: 0.38,
        ease: "power2.in",
      })
      .to(shadowEl, {
        scale: 1,
        opacity: 0.7,
        duration: 0.38,
        ease: "power2.in",
      }, "<")

      // 2. Physical impact squash & settle (0.38 -> 0.52s)
      .to(packageEl, {
        scaleY: 0.88,
        scaleX: 1.06,
        duration: 0.06,
        ease: "power2.out",
      })
      .to(packageEl, {
        scaleY: 1,
        scaleX: 1,
        duration: 0.1,
        ease: "power1.inOut",
      })

      // 3. Conveyor moves forward beneath package (0.52 -> 0.96s)
      .to(conveyorBelt, {
        x: -600,
        duration: 0.44,
        ease: "power1.inOut",
      }, "+=0.04")
      .to(worldGroup, {
        x: -240,
        duration: 0.44,
        ease: "power1.inOut",
      }, "<")

      // 4. CAMERA ZOOMS DEAD-CENTER INTO THE PARCEL (0.92 -> 2.15s)
      // Visual zoom is completely unobstructed for the first half of the dive
      .to(cam, {
        scale: 8.5,
        duration: 1.25,
        ease: "power2.inOut",
        onUpdate: () => {
          if (cameraStage) {
            const s = cam.scale;
            const tx = 720 * (1 - s);
            const ty = 540 * (1 - s);
            cameraStage.setAttribute("transform", `translate(${tx}, ${ty}) scale(${s})`);
          }
        },
      }, "-=0.04")

      // 5. Package lid tape parts and internal warm recovery glow radiates (1.45s)
      .to(".pl-pkg-tape", {
        y: -24,
        opacity: 0.4,
        duration: 0.4,
        ease: "power2.out",
      }, "-=0.85")
      .to(".pl-pkg-glow", {
        opacity: 0.9,
        scale: 2.5,
        duration: 0.45,
        ease: "power2.out",
      }, "<")

      // 6. Volumetric clouds erupt outward from package center as camera enters (1.55 -> 2.10s)
      .to(cloudLayer, {
        opacity: 1,
        scale: 3.5,
        transformOrigin: `${PKG_CENTER_X}px ${PKG_CENTER_Y}px`,
        duration: 0.65,
        ease: "power2.out",
      }, "-=0.65")
      .to(cloudPuffs, {
        scale: 2.4,
        opacity: 0.95,
        duration: 0.6,
        stagger: {
          each: 0.03,
          from: "center",
        },
        ease: "power2.out",
      }, "<")

      // 7. Atmospheric GPU mist clouds expand to envelop the screen (1.65 -> 2.25s)
      .to([".pl-html-mist-core", ".pl-html-mist-puff-left", ".pl-html-mist-puff-right"], {
        opacity: 0.98,
        scale: 3.6,
        duration: 0.65,
        stagger: 0.04,
        ease: "power2.out",
        force3D: true,
      }, "-=0.55")

      // 8. Smooth fog veil wraps the scene seamlessly into login background (1.85 -> 2.25s)
      .to(".pl-fog-veil", {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
      }, "-=0.35")

      // 9. Clean dissolve reveals the operations login terminal (2.05 -> 2.35s)
      .to(container, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      }, "-=0.15");

    }, container);

    return () => ctx.revert();
  }, [mounted, onComplete]);

  if (!mounted || !visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] h-[100dvh] w-[100vw] overflow-hidden bg-background"
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-8 z-50 font-mono text-[11px] tracking-widest text-muted hover:text-foreground uppercase transition-colors px-3 py-1.5 rounded-full border border-border bg-surface/80 backdrop-blur-sm cursor-pointer"
      >
        Skip ✕
      </button>

      <svg
        viewBox="0 0 1440 900"
        className="h-full w-full object-cover select-none will-change-transform"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Piggyback operations loader"
      >
        <defs>
          {/* Soft warehouse lighting radial gradient */}
          <radialGradient id="whGlow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--background)" stopOpacity="1" />
          </radialGradient>

          {/* Core Volumetric Cloud Puff - Soft feathered vapor (Zero CPU blur overhead) */}
          <radialGradient id="cloudPuffCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#F8F4EE" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#EEE5D8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EEE5D8" stopOpacity="0" />
          </radialGradient>

          {/* Outer Billowing Vapor Puff */}
          <radialGradient id="cloudPuffVapor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.94" />
            <stop offset="45%" stopColor="#F5EFE6" stopOpacity="0.82" />
            <stop offset="75%" stopColor="#E6DDD0" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#E6DDD0" stopOpacity="0" />
          </radialGradient>

          {/* Warm internal package recovery radiance */}
          <radialGradient id="pkgInnerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E05A2B" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#F6A24E" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#F6F1E8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F6F1E8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background Wash */}
        <rect width="1440" height="900" fill="url(#whGlow)" />

        {/* Camera Stage (Scales and zooms dead-center into the package) */}
        <g ref={cameraRef} className="pl-camera-stage">
          {/* World / Warehouse Structural Columns (Moves with camera) */}
          <g className="pl-world" opacity="0.08">
            {Array.from({ length: 12 }).map((_, i) => (
              <g key={i} transform={`translate(${i * 240}, 0)`}>
                <rect x="0" y="0" width="36" height="900" fill="var(--foreground)" />
                <line x1="36" y1="0" x2="36" y2="900" stroke="var(--foreground)" strokeWidth="2" />
                <line x1="18" y1="0" x2="18" y2="600" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="8 8" />
              </g>
            ))}
          </g>

          {/* Industrial Conveyor Trusses & Floor Supports (Stationary floor) */}
          <g opacity="0.25">
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i} transform={`translate(${i * 200 + 40}, 648)`}>
                {/* Vertical Truss Leg */}
                <rect x="0" y="0" width="16" height="252" fill="var(--foreground)" rx="3" />
                <rect x="-10" y="240" width="36" height="12" fill="var(--foreground)" rx="2" />
                {/* Diagonal Cross Brace */}
                <line x1="8" y1="10" x2="140" y2="240" stroke="var(--foreground)" strokeWidth="4" />
                <line x1="140" y1="10" x2="8" y2="240" stroke="var(--foreground)" strokeWidth="4" />
              </g>
            ))}
          </g>

          {/* Physical Conveyor Assembly */}
          <g>
            {/* Conveyor Bed Base / Depth Plate (Y=600 to 648) */}
            <rect
              x="-500"
              y={CONVEYOR_TOP_Y}
              width="2500"
              height="48"
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="4"
            />

            {/* Conveyor Top Surface Highlight (Y=600, 4px thick) */}
            <rect
              x="-500"
              y={CONVEYOR_TOP_Y}
              width="2500"
              height="4"
              fill="var(--accent)"
              opacity="0.6"
            />

            {/* Moving Rollers (Embedded inside belt body) */}
            <g className="pl-belt-rollers">
              {Array.from({ length: 50 }).map((_, i) => (
                <g key={i} transform={`translate(${i * 64 - 400}, ${CONVEYOR_TOP_Y + 24})`}>
                  <circle cx="0" cy="0" r="14" fill="var(--background)" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="0" cy="0" r="4" fill="var(--accent)" />
                </g>
              ))}
            </g>
          </g>

          {/* Dynamic Contact Shadow on Conveyor Top (Y = 600) */}
          <g className="pl-shadow" style={{ transformOrigin: "center center" }}>
            <ellipse
              cx={PACKAGE_WIDTH / 2}
              cy="0"
              rx="85"
              ry="9"
              fill="var(--foreground)"
              opacity="0.45"
            />
          </g>

          {/* The Misplaced Package (180 x 120, centered at 720, 540) */}
          <g className="pl-package">
            {/* Package Outer Box */}
            <rect
              x="0"
              y="0"
              width={PACKAGE_WIDTH}
              height={PACKAGE_HEIGHT}
              rx="12"
              fill="var(--surface)"
              stroke="var(--foreground)"
              strokeWidth="5"
            />

            {/* Internal warm radiant glow (centered at 90, 60 -> 720, 540) */}
            <circle
              className="pl-pkg-glow"
              cx="90"
              cy="60"
              r="70"
              fill="url(#pkgInnerGlow)"
              pointerEvents="none"
            />

            {/* Horizontal Sealing Center Band */}
            <path d="M 0 60 L 180 60" stroke="var(--foreground)" strokeWidth="4" opacity="0.3" />

            {/* Orange Reinforced Top Tape / Lid */}
            <rect className="pl-pkg-tape" x="45" y="0" width="90" height="18" fill="var(--accent)" rx="2" />

            {/* Operational Tag: OPERATIONS INGEST */}
            <g transform="translate(24, 28)">
              <rect x="0" y="0" width="132" height="26" rx="13" fill="var(--accent)" />
              <text
                x="66"
                y="17"
                textAnchor="middle"
                fontSize="10.5"
                fill="var(--accent-foreground, #FFFFFF)"
                fontFamily="var(--font-geist-mono), monospace"
                fontWeight="bold"
                letterSpacing="0.14em"
              >
                {variant === "staff" ? "OPERATIONS INGEST" : "PIGGYBACK SYSTEM"}
              </text>
            </g>

            {/* Shipment Identification */}
            <text
              x="90"
              y="90"
              textAnchor="middle"
              fontSize="14"
              fill="var(--foreground)"
              fontFamily="var(--font-geist-mono), monospace"
              fontWeight="bold"
              letterSpacing="0.14em"
            >
              SHP-2048
            </text>

            {/* Barcode details */}
            <g transform="translate(45, 100)" opacity="0.55">
              <line x1="0" y1="0" x2="0" y2="10" stroke="var(--foreground)" strokeWidth="2.5" />
              <line x1="8" y1="0" x2="8" y2="10" stroke="var(--foreground)" strokeWidth="3.5" />
              <line x1="18" y1="0" x2="18" y2="10" stroke="var(--foreground)" strokeWidth="1.5" />
              <line x1="28" y1="0" x2="28" y2="10" stroke="var(--foreground)" strokeWidth="3" />
              <line x1="42" y1="0" x2="42" y2="10" stroke="var(--foreground)" strokeWidth="2" />
              <line x1="56" y1="0" x2="56" y2="10" stroke="var(--foreground)" strokeWidth="3.5" />
              <line x1="70" y1="0" x2="70" y2="10" stroke="var(--foreground)" strokeWidth="2" />
              <line x1="82" y1="0" x2="82" y2="10" stroke="var(--foreground)" strokeWidth="4" />
            </g>
          </g>

          {/* =========================================================
              VOLUMETRIC CLOUDY TRANSITION SYSTEM (Dead center at package: 720, 540)
              Uses zero-cost feathered radial gradients for 60fps buttery smoothness
             ========================================================= */}
          <g className="pl-cloud-system pointer-events-none">
            <circle className="pl-cloud-puff" cx="720" cy="540" r="150" fill="url(#cloudPuffCore)" />
            <circle className="pl-cloud-puff" cx="640" cy="510" r="135" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="800" cy="520" r="140" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="720" cy="460" r="155" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="630" cy="580" r="130" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="810" cy="570" r="135" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="720" cy="620" r="165" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="660" cy="480" r="145" fill="url(#cloudPuffVapor)" />
            <circle className="pl-cloud-puff" cx="780" cy="490" r="150" fill="url(#cloudPuffVapor)" />
          </g>
        </g>
      </svg>

      {/* =========================================================
          ATMOSPHERIC GPU MIST LAYERS & FOG DISSOLVE
          Hardware-accelerated CSS compositor layers for ultra-smooth depth
         ========================================================= */}
      <div className="pl-atmosphere absolute inset-0 pointer-events-none overflow-hidden will-change-[opacity,transform]">
        {/* Core mist billow anchored at package center (50% 60%) */}
        <div
          className="pl-html-mist-core absolute rounded-full pointer-events-none"
          style={{
            width: "600px",
            height: "600px",
            left: "50%",
            top: "60%",
            background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(246,241,232,0.85) 45%, rgba(246,241,232,0) 72%)",
            filter: "blur(24px)",
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
        <div
          className="pl-html-mist-puff-left absolute rounded-full pointer-events-none"
          style={{
            width: "720px",
            height: "720px",
            left: "44%",
            top: "56%",
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(246,241,232,0.78) 48%, rgba(246,241,232,0) 75%)",
            filter: "blur(32px)",
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
        <div
          className="pl-html-mist-puff-right absolute rounded-full pointer-events-none"
          style={{
            width: "740px",
            height: "740px",
            left: "56%",
            top: "63%",
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(246,241,232,0.78) 48%, rgba(246,241,232,0) 75%)",
            filter: "blur(32px)",
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
        {/* Fullscreen smooth fog veil matching background */}
        <div
          className="pl-fog-veil absolute inset-0 bg-background pointer-events-none"
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </div>

      {/* Operations Status Pill */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.24em] text-foreground/50 z-10 pointer-events-none">
        INITIALIZING PIGGYBACK OPERATIONS
      </div>
    </div>
  );
}
