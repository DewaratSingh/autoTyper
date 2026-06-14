'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const journey = [
  { year: '2025', event: 'Started as a CS student, struggled to follow lecture code' },
  { year: '2025', event: 'Began teaching workshops, faced the same typing problem myself' },
  { year: '2026', event: 'Built the first version of AutoTyper to solve my own problem' },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative"
      style={{
        padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 7rem)',
        background: 'transparent',
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 30% 50%, rgba(59,130,246,0.05), transparent 70%)',
        }}
      />

      {/* Decorative floating cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { top: '10%', left: '5%', delay: 0 },
          { top: '60%', right: '4%', delay: 1 },
          { bottom: '15%', left: '8%', delay: 2 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: pos.delay }}
            className="absolute rounded-2xl hidden lg:block"
            style={{
              ...pos,
              width: '120px',
              height: '80px',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(59,130,246,0.1)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.08)',
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
         
          <h2
            className="font-display font-black"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)',
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: 1.15,
            }}
          >
            Built By A Developer Who
            <br />
            <span className="gradient-text">Faced The Same Problem</span>
          </h2>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(59,130,246,0.1)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.06), 0 0 0 1px rgba(59,130,246,0.05)',
          }}
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Profile */}
            <div
              className="flex flex-col items-center justify-center p-10 md:p-14"
              style={{
                background:
                  'linear-gradient(135deg, rgba(239,246,255,0.8), rgba(219,234,254,0.5))',
                borderRight: '1px solid rgba(59,130,246,0.08)',
              }}
            >
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                className="relative mb-6"
              >
                <div
                  className="rounded-full overflow-hidden"
                  style={{
                    width: '140px',
                    height: '140px',
                    border: '4px solid rgba(59,130,246,0.2)',
                    boxShadow: '0 0 0 8px rgba(59,130,246,0.06), 0 20px 60px rgba(59,130,246,0.15)',
                  }}
                >
                  <Image
                    src="/developer.png"
                    alt="Developer"
                    width={140}
                    height={140}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Status badge */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#059669',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                      animation: 'glow-pulse 2s ease-in-out infinite',
                    }}
                  />
                  Open to Feedback
                </div>
              </motion.div>

              <h3
                className="font-display font-bold text-center mb-1"
                style={{ fontSize: '1.375rem', color: '#0f172a' }}
              >
                Dewarat Singh
              </h3>
              <p className="text-center text-sm mb-6" style={{ color: '#64748b' }}>
                Developer · Educator · Builder
              </p>

              {/* Social buttons */}
              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <GitHubIcon size={16} />
                  GitHub
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    background: '#0a66c2',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(10,102,194,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <LinkedInIcon size={16} />
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Right: Story */}
            <div className="p-10 md:p-14">
              <blockquote
                className="font-display font-medium italic mb-8"
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  color: '#334155',
                  lineHeight: 1.6,
                  borderLeft: '3px solid #3b82f6',
                  paddingLeft: '1.25rem',
                }}
              >
                &ldquo;I was the student in the back row, confused because the teacher typed too fast,
                made too many typos, or just pasted the whole solution. I built AutoTyper so no student
                ever has to feel that way again.&rdquo;
              </blockquote>

              {/* Journey timeline */}
              <div className="space-y-4">
                {journey.map((item, i) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-4 items-start"
                  >
                    <span
                      className="font-mono font-bold text-xs shrink-0 mt-0.5 rounded-lg px-2 py-1"
                      style={{
                        background: 'rgba(59,130,246,0.08)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59,130,246,0.15)',
                      }}
                    >
                      {item.year}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                      {item.event}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Link */}
              <a
                href="#"
                className="inline-flex items-center gap-2 mt-8 text-sm font-medium transition-all duration-200"
                style={{ color: '#3b82f6' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.gap = '12px';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.gap = '8px';
                }}
              >
                Read the full story
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
