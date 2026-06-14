'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis smooth scroll with lerp for consistent, gradual smoothing on mouse wheel
    const lenis = new Lenis({
      lerp: 0.045, // Premium linear interpolation (lower = slower/heavier glide)
      smoothWheel: true,
      wheelMultiplier: 0.45, // Scale down mouse wheel ticks to prevent skipping frames/sections
      touchMultiplier: 1.0,
    });

    // Expose lenis instance globally so sections can sync if needed
    (window as typeof window & { lenis: Lenis }).lenis = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // GSAP ticker drives Lenis RAF
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
