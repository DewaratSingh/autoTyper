'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(
        titleRef.current,
        {
          scale: 0.07,
          y: '-46vh',
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
        .to(
          glowRef.current,
          { opacity: 0, scale: 0.5, duration: 0.6, ease: 'power2.in' },
          0
        )
        .to(
          taglineRef.current,
          { opacity: 0, y: -40, duration: 0.5, ease: 'power2.in' },
          0
        )
        .to(
          scrollIndicatorRef.current,
          { opacity: 0, duration: 0.3, ease: 'power2.in' },
          0
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ height: '100vh', background: 'transparent' }}
    >
      {/* Background radial glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,130,246,0.10) 0%, rgba(147,197,253,0.06) 40%, transparent 70%)',
        }}
      />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Giant title */}
      <div className="relative z-10 text-center px-4">
        <h1
          ref={titleRef}
          className="font-display font-black select-none"
          style={{
            fontSize: 'clamp(4rem, 16vw, 18rem)',
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            color: '#0f172a',
            transformOrigin: 'center center',
            textShadow: '0 0 120px rgba(59,130,246,0.15)',
          }}
        >
          AUTO
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TYPER
          </span>
        </h1>

       
      </div>

      {/* Scroll indicator */}
      <motion.div
        ref={scrollIndicatorRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: '#94a3b8' }}
      >
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <div
          className="flex flex-col items-center gap-1"
          style={{ animation: 'float 2s ease-in-out infinite' }}
        >
          <div
            style={{
              width: '24px',
              height: '40px',
              border: '2px solid rgba(148,163,184,0.4)',
              borderRadius: '999px',
              display: 'flex',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '8px',
                borderRadius: '999px',
                background: '#3b82f6',
                animation: 'float 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
