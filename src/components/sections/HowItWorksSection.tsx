'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const steps = [
  {
    num: '01',
    title: 'Paste Your Code',
    description:
      'Copy the code you want to teach into AutoTyper. Supports all Programming Languages.',
    icon: '📋',
    color: '#3b82f6',
  },
  {
    num: '02',
    title: 'Arrange Lecture Flow',
    description:
      'Order your files and code blocks in the sequence you want to teach.',
    icon: '🗂️',
    color: '#8b5cf6',
  },
  {
    num: '03',
    title: 'Save Your Project',
    description:
      'Save your lecture as a reusable project. Open it any time and pick up exactly where you left off.',
    icon: '💾',
    color: '#0ea5e9',
  },
  {
    num: '04',
    title: 'Press F8',
    description:
      'One key to start. One key to pause. AutoTyper handles everything — you focus on teaching.',
    icon: '⌨️',
    color: '#10b981',
  },
  {
    num: '05',
    title: 'Teach With Confidence',
    description:
      'No typos. No rushing. No pasting walls of code. Your students watch code emerge naturally and understand every step.',
    icon: '🎓',
    color: '#f59e0b',
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Draw the vertical timeline line
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative"
      style={{
        padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 7rem)',
        background: '#f8faff',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 70% at 90% 50%, rgba(139,92,246,0.05), transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          
          <h2
            className="font-display font-black"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.75rem)',
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: 1.1,
            }}
          >
            5 Steps To
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Better Lectures
            </span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute"
            style={{
              left: 'clamp(20px, 4vw, 32px)',
              top: '28px',
              bottom: '28px',
              width: '2px',
              background: 'rgba(59,130,246,0.1)',
            }}
          >
            <div
              ref={lineRef}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)',
                transformOrigin: 'top center',
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="flex items-start gap-6 md:gap-10 group"
              >
                {/* Step node */}
                <div className="relative flex-shrink-0" style={{ width: 'clamp(40px, 8vw, 64px)' }}>
                  <div
                    className="relative flex items-center justify-center rounded-full z-10 text-xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      width: 'clamp(40px, 8vw, 64px)',
                      height: 'clamp(40px, 8vw, 64px)',
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                      border: `2px solid ${step.color}40`,
                      boxShadow: `0 4px 20px ${step.color}20`,
                    }}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 pb-4 transition-all duration-300"
                  style={{ paddingTop: '6px' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="font-mono font-bold text-xs"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </span>
                    <h3
                      className="font-display font-bold"
                      style={{ fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)', color: '#0f172a' }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p className="leading-relaxed" style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
