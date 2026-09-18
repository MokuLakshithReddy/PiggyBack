"use client";

import gsap from "gsap";

export function playHeroIntro(root: HTMLElement) {
  const ctx = gsap.context(() => {
    const route = root.querySelector<SVGPathElement>("[data-hero-route]");
    const crate = root.querySelector<SVGGElement>("[data-hero-package]");
    const truck = root.querySelector<SVGGElement>("[data-hero-truck]");
    const status = root.querySelector("[data-hero-status]");
    const labels = gsap.utils.toArray<Element>("[data-hero-label]", root);
    const nav = gsap.utils.toArray<Element>("[data-hero-nav]", root);
    const copy = gsap.utils.toArray<Element>("[data-hero-copy]", root);

    if (!route || !crate || !truck || !status) {
      return;
    }

    const routeLength = route.getTotalLength();
    const packageRest = { x: 236, y: -40 };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(route, {
      strokeDasharray: routeLength,
      strokeDashoffset: routeLength,
    });

    if (reduced) {
      gsap.set([nav, copy, labels, crate, truck, status], { opacity: 1, y: 0, x: 0 });
      gsap.set(crate, packageRest);
      gsap.set(route, { strokeDashoffset: 0 });
      return;
    }

    gsap.set(nav, { opacity: 0 });
    gsap.set(copy, { opacity: 0, y: 28 });
    gsap.set(labels, { opacity: 0, y: 8 });
    gsap.set(crate, { opacity: 0, scale: 0.86, transformOrigin: "center" });
    gsap.set(truck, { opacity: 0, x: -36 });
    gsap.set(status, { opacity: 0, y: 8 });

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    timeline
      .to(nav, { opacity: 1, duration: 0.7, stagger: 0.06 }, 0)
      .to(copy, { opacity: 1, y: 0, duration: 0.95, stagger: 0.12 }, 0.12)
      .to(labels, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.45)
      .to(
        crate,
        { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.4)" },
        0.55,
      )
      .to(
        route,
        { strokeDashoffset: 0, duration: 1.35, ease: "power2.inOut" },
        0.85,
      )
      .to(
        truck,
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
        1.45,
      )
      .to(
        crate,
        { ...packageRest, duration: 1.15, ease: "power2.inOut" },
        1.85,
      )
      .to(
        status,
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        2.85,
      );

    timeline.add(() => {
      gsap.to(truck, {
        y: -3,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(crate, {
        y: packageRest.y - 2,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, 3.2);
  }, root);

  return () => ctx.revert();
}
