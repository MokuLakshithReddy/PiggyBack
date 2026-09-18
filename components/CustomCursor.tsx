"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Disable on touch devices
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      const el = e.target as HTMLElement;
      const interactable = el.closest("a, button, [data-cursor]");
      if (interactable) {
        setExpanded(true);
        const cursorLabel = interactable.getAttribute("data-cursor") ?? "";
        setLabel(cursorLabel);
      } else {
        setExpanded(false);
        setLabel("");
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf: number;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={dotRef}
      className="cursor-dot"
      style={{
        width: expanded ? 64 : 12,
        height: expanded ? 64 : 12,
        borderRadius: "50%",
        background: expanded ? "rgba(200,91,40,0.12)" : "var(--foreground)",
        border: expanded ? "1.5px solid var(--accent)" : "none",
        transition: "width 0.2s, height 0.2s, background 0.2s, border 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label && (
        <span
          className="font-mono text-[9px] font-bold tracking-widest text-accent"
          style={{ transition: "opacity 0.15s" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
