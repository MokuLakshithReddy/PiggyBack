"use client";

import { gsap } from "./gsap";

export function playStoryAnimation(container: HTMLElement) {
  return gsap.context(() => {
    const steps = gsap.utils.toArray<HTMLElement>("[data-story]");
    
    if (steps.length < 3) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(steps, { opacity: 1, position: "relative", height: "auto", clipPath: "none" });
      return;
    }

    // Set initial opacities & pointer events
    gsap.set(steps[0], { opacity: 1 });
    gsap.set(steps.slice(1), { opacity: 0 });
    steps[0].style.pointerEvents = "auto";
    steps[1].style.pointerEvents = "none";
    steps[2].style.pointerEvents = "none";

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // Deterministic smooth scrub
        onUpdate: (self) => {
          const p = self.progress;
          if (p < 0.28) {
            steps[0].style.pointerEvents = "auto";
            steps[1].style.pointerEvents = "none";
            steps[2].style.pointerEvents = "none";
          } else if (p >= 0.28 && p <= 0.72) {
            steps[0].style.pointerEvents = "none";
            steps[1].style.pointerEvents = "auto";
            steps[2].style.pointerEvents = "none";
          } else {
            steps[0].style.pointerEvents = "none";
            steps[1].style.pointerEvents = "none";
            steps[2].style.pointerEvents = "auto";
          }
        },
      },
    });

    // Stay on Step 1 (That means...)
    tl.to({}, { duration: 0.2 });

    // Step 1 -> Step 2 (Misplaced Shipment Details)
    tl.to(steps[0], { opacity: 0, duration: 1, ease: "power1.inOut" })
      .to(steps[1], { opacity: 1, duration: 1, ease: "power1.inOut" }, "<");

    // Stay on Step 2
    tl.to({}, { duration: 0.6 });

    // Step 2 -> Step 3 (Dark Cinematic "What if...")
    tl.to(steps[1], { opacity: 0, duration: 1, ease: "power1.inOut" })
      .fromTo(steps[2], 
        { clipPath: "inset(100% 0% 0% 0%)", opacity: 1 }, 
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power2.inOut", immediateRender: false }, 
        "<"
      );
      
    // Stay on Step 3
    tl.to({}, { duration: 0.5 });

  }, container);
}
