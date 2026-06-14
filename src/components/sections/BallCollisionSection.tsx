'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Generate distinct explosion particles (angles and distances)
const PARTICLES = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 360) / 24 + (Math.random() - 0.5) * 8;
  const distance = 160 + Math.random() * 280; // Distance to shoot out
  const size = 8 + Math.random() * 12; // Diameter in pixels
  const isBlue = i % 2 === 0;
  // Custom drift rotation for variety
  const rotate = (Math.random() - 0.5) * 360;
  return { angle, distance, size, isBlue, rotate };
});

export default function BallCollisionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftBallRef = useRef<HTMLDivElement>(null);
  const rightBallRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const mainGlowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Main scroll timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%', // Pin for 150% of viewport height
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1. Moving closer (0 to 0.55 progress)
      tl.fromTo(
        leftBallRef.current,
        { x: '-50vw', y: '-50%', scale: 0.8, rotate: -15, opacity: 0 },
        { x: '0px', y: '-50%', scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: 'power2.inOut' },
        0
      ).fromTo(
        rightBallRef.current,
        { x: '50vw', y: '-50%', scale: 0.8, rotate: 15, opacity: 0 },
        { x: '0px', y: '-50%', scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: 'power2.inOut' },
        0
      );

      // 2. Squash and Collide (0.55 to 0.62 progress)
      // As they get close, compress horizontally and stretch vertically
      tl.to(
        [leftBallRef.current, rightBallRef.current],
        { scaleX: 0.8, scaleY: 1.2, duration: 0.04, ease: 'none' },
        0.55
      );

      // Complete collision impact and squash flat at center (0.59 to 0.62)
      tl.to(
        leftBallRef.current,
        { x: '0px', scaleX: 1.3, scaleY: 0.7, duration: 0.03, ease: 'none' },
        0.59
      ).to(
        rightBallRef.current,
        { x: '0px', scaleX: 1.3, scaleY: 0.7, duration: 0.03, ease: 'none' },
        0.59
      );

      // 3. The Blast & Fade Out (0.62 to 0.70 progress)
      tl.to(
        [leftBallRef.current, rightBallRef.current],
        { scale: 0, opacity: 0, duration: 0.04, ease: 'power2.in' },
        0.62
      );

      // Trigger rings explosion waves
      tl.fromTo(
        ring1Ref.current,
        { scale: 0.1, opacity: 0 },
        { scale: 10, opacity: 1, duration: 0.02, ease: 'none' },
        0.61
      ).to(
        ring1Ref.current,
        { scale: 22, opacity: 0, duration: 0.15, ease: 'power2.out' },
        0.63
      );

      tl.fromTo(
        ring2Ref.current,
        { scale: 0.1, opacity: 0 },
        { scale: 8, opacity: 1, duration: 0.03, ease: 'none' },
        0.61
      ).to(
        ring2Ref.current,
        { scale: 26, opacity: 0, duration: 0.18, ease: 'power2.out' },
        0.64
      );

      // White flash impact overlay
      tl.fromTo(
        flashRef.current,
        { opacity: 0 },
        { opacity: 0.6, duration: 0.02, ease: 'power1.out' },
        0.61
      ).to(
        flashRef.current,
        { opacity: 0, duration: 0.12, ease: 'power1.in' },
        0.63
      );

      // Expanding background glow
      tl.fromTo(
        mainGlowRef.current,
        { scale: 0.2, opacity: 0 },
        { scale: 3.5, opacity: 0.45, duration: 0.08, ease: 'power2.out' },
        0.61
      ).to(
        mainGlowRef.current,
        { scale: 5, opacity: 0, duration: 0.2, ease: 'power1.inOut' },
        0.69
      );

      // Animate each of the 24 blast particles
      PARTICLES.forEach((p, idx) => {
        const rad = (p.angle * Math.PI) / 180;
        const targetX = Math.cos(rad) * p.distance;
        const targetY = Math.sin(rad) * p.distance;

        tl.fromTo(
          `.particle-${idx}`,
          { x: 0, y: 0, scale: 0, opacity: 0 },
          { x: targetX * 0.4, y: targetY * 0.4, scale: 1.4, opacity: 1, duration: 0.03, ease: 'power1.out' },
          0.61
        ).to(
          `.particle-${idx}`,
          {
            x: targetX,
            y: targetY,
            scale: 0,
            opacity: 0,
            rotate: p.rotate,
            duration: 0.22,
            ease: 'power3.out',
          },
          0.64
        );
      });

      // Staggered Text Reveal in the center of the blast (0.64 to 0.85 progress)
      tl.fromTo(
        textRef.current,
        { scale: 0.85, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.15, ease: 'power2.out' },
        0.65
      ).to(
        textRef.current,
        { y: -30, opacity: 0, filter: 'blur(6px)', duration: 0.15, ease: 'power2.in', delay: 0.1 },
        0.82
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="collision-sequence"
      className="relative flex items-center justify-center overflow-hidden bg-transparent"
      style={{ height: '100vh', width: '100%' }}
    >
      {/* Dynamic Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Screen flash impact */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none z-50 opacity-0"
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Central Arena Container */}
      <div ref={containerRef} className="relative w-full max-w-4xl h-96 flex items-center justify-center">
        
        {/* Main radial glow expander */}
        <div
          ref={mainGlowRef}
          className="absolute rounded-full pointer-events-none opacity-0"
          style={{
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(96,165,250,0.1) 50%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Ring waves */}
        <div
          ref={ring1Ref}
          className="absolute rounded-full border-2 pointer-events-none opacity-0"
          style={{
            width: '60px',
            height: '60px',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
          }}
        />
        <div
          ref={ring2Ref}
          className="absolute rounded-full border pointer-events-none opacity-0"
          style={{
            width: '60px',
            height: '60px',
            borderColor: 'rgba(15, 23, 42, 0.3)',
            boxShadow: '0 0 30px rgba(15, 23, 42, 0.15)',
          }}
        />

        {/* Particles container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {PARTICLES.map((p, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full particle-${idx} opacity-0`}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.isBlue
                  ? 'linear-gradient(135deg, #60a5fa, #2563eb)'
                  : 'linear-gradient(135deg, #475569, #0f172a)',
                boxShadow: p.isBlue
                  ? '0 0 8px rgba(37,99,235,0.4)'
                  : '0 0 6px rgba(15,23,42,0.2)',
              }}
            />
          ))}
        </div>

        {/* LEFT TEXT: "Teaching" */}
        <div
          ref={leftBallRef}
          className="absolute right-1/2 font-display font-black tracking-tight select-none uppercase pointer-events-none"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
            color: '#0f172a',
            transform: 'translateY(-50%)',
            transformOrigin: 'right center',
            whiteSpace: 'nowrap',
            paddingRight: '16px',
            textShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          }}
        >
          Teaching
        </div>

        {/* RIGHT TEXT: "Technology" */}
        <div
          ref={rightBallRef}
          className="absolute left-1/2 font-display font-black tracking-tight select-none uppercase pointer-events-none"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transform: 'translateY(-50%)',
            transformOrigin: 'left center',
            whiteSpace: 'nowrap',
            paddingLeft: '16px',
            filter: 'drop-shadow(0 10px 30px rgba(59, 130, 246, 0.15))',
          }}
        >
          Technology
        </div>

        {/* Text revealed on blast */}
        <div
          ref={textRef}
          className="absolute text-center select-none pointer-events-none opacity-0 px-4"
        >
          <h3
            className="font-display font-black tracking-tight"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.75rem)',
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Where Teaching Code Meets
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ultimate Simplicity
            </span>
          </h3>
          <p className="mt-3 text-xs md:text-sm font-medium tracking-widest text-slate-400 uppercase">
            Introducing AutoTyper
          </p>
        </div>

      </div>
    </section>
  );
}
