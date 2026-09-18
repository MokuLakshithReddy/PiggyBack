"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function createGsapContext(scope?: Element | string) {
  return gsap.context(() => {}, scope);
}
