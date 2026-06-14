'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lines = [
  'WHAT  IF',
  'AN  ENTIRE  PROGRAM',
  'COULD  BE  WRITTEN',
  'WITH  A  SINGLE  KEY?',
];



export default function BigStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const linesRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      linesRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 60, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            delay: i * 0.12,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="statement"
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        minHeight: '100vh',
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 5vw, 7rem)',
        background: 'transparent',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={line} className="overflow-hidden">
              <span
                ref={(el) => { linesRef.current[i] = el; }}
                className="block font-display font-black"
                style={{
                  fontSize:
                    i === 3
                      ? 'clamp(2.5rem, 7vw, 7rem)'
                      : 'clamp(2rem, 5.5vw, 5.5rem)',
                  letterSpacing: i === 0 ? '-0.02em' : '-0.03em',
                  lineHeight: 1.05,
                  color:
                    i === lines.length - 1
                      ? undefined
                      : '#0f172a',
                  background:
                    i === lines.length - 1
                      ? 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)'
                      : undefined,
                  WebkitBackgroundClip:
                    i === lines.length - 1 ? 'text' : undefined,
                  WebkitTextFillColor:
                    i === lines.length - 1 ? 'transparent' : undefined,
                  backgroundClip:
                    i === lines.length - 1 ? 'text' : undefined,
                  willChange: 'opacity, transform, filter',
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>

        {/* <F8Key /> */}
      </div>
    </section>
  );
}
