"use client";

import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  /** Animation duration in ms (default: 800) */
  duration?: number;
  /** Only animate when true — pass `!loading` to wait for data (default: true) */
  enabled?: boolean;
  /** Easing function (default: ease-out cubic) */
  easing?: (t: number) => number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { duration = 800, enabled = true, easing = easeOutCubic } = options;

  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    fromRef.current = value;
    startTimeRef.current = null;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    function tick(ts: number) {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(fromRef.current + (target - fromRef.current) * easing(progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return value;
}
