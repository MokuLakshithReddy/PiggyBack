"use client";

import { gsap } from "./gsap";

export function playIdeaAnimation(container: HTMLElement) {
  return gsap.context(() => {
    const title = container.querySelector("[data-idea-title]");
    const route = container.querySelector("[data-idea-route]");
    const shipment = container.querySelector("[data-idea-shipment]");
    const hub = container.querySelector("[data-idea-hub]");
    const destination = container.querySelector("[data-idea-destination]");
    const capacity = container.querySelector("[data-idea-capacity]");

    if (!title || !route || !shipment || !hub || !destination || !capacity) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([title, route, shipment, hub, destination, capacity], { opacity: 1 });
      return;
    }

    // Initial deterministic state
    gsap.set([title, shipment, hub, destination, capacity], { opacity: 0 });
    gsap.set(shipment, { x: 0, y: 0 }); // Starts at its natural SVG translate(100, 200)
    
    const routePath = route as SVGPathElement;
    const length = routePath.getTotalLength();
    gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    // Step 1: title and shipment fade in
    tl.to(title, { opacity: 1, duration: 1, ease: "power1.inOut" })
      .to(shipment, { opacity: 1, duration: 1, ease: "power1.inOut" }, "-=0.5")

    // Step 2: route draws
    tl.to(route, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" })

    // Step 3 & 4: transfer hub and capacity appear
    tl.to(hub, { opacity: 1, duration: 1, ease: "power1.inOut" }, "-=0.5")
      .to(capacity, { opacity: 1, duration: 1, ease: "power1.inOut" }, "-=0.5")
      .to(destination, { opacity: 1, duration: 1, ease: "power1.inOut" }, "-=0.5")

    // Step 5 & 6: shipment moves to hub (Hub is at 400, 135; Start is 100, 200 -> dx: 300, dy: -65)
    tl.to(shipment, { x: 300, y: -65, duration: 2, ease: "power1.inOut" })

    // Pause slightly at hub
    tl.to(capacity, { scale: 1.1, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.inOut" })

    // Step 7: shipment moves to destination (Dest is at 700, 150 -> dx: 600, dy: -50)
    tl.to(shipment, { x: 600, y: -50, duration: 2, ease: "power1.inOut" })

    // Step 8: successful state
    tl.to(destination, { scale: 1.2, transformOrigin: "center", duration: 1, ease: "power1.inOut" });

  }, container);
}
