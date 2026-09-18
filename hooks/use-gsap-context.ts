"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { createGsapContext } from "@/components/animation/gsap";

export function useGsapContext<T extends Element>(
  scopeRef: RefObject<T | null>,
) {
  const contextRef = useRef<ReturnType<typeof createGsapContext> | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    const ctx = createGsapContext(scope);
    contextRef.current = ctx;

    return () => {
      ctx.revert();
      contextRef.current = null;
    };
  }, [scopeRef]);

  return contextRef;
}
