'use client';

import { motion } from 'framer-motion';

export default function FooterSection() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: '#0f172a',
        padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 7rem) clamp(2rem, 4vw, 3rem)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(59,130,246,0.08), transparent 70%)',
        }}
      />

      {/* Grid decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-display font-black"
            style={{
              fontSize: 'clamp(3rem, 10vw, 9rem)',
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              color: 'rgba(255,255,255,0.06)',
            }}
          >
            AUTO TYPER
          </motion.h2>
        </div>

        {/* Divider */}
        <div
          className="w-full mb-10"
          style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
        />

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span
              className="font-display font-black"
              style={{ fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.04em' }}
            >
              AUTO<span style={{ color: '#3b82f6' }}>TYPER</span>
            </span>
            <span className="text-sm" style={{ color: '#475569' }}>
              Teach. Don&apos;t Type.
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            {['Features', 'Demo', 'How It Works', 'FAQ', 'About'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm transition-colors duration-200"
                style={{ color: '#475569' }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = '#475569';
                }}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm" style={{ color: '#334155' }}>
            © {new Date().getFullYear()} AutoTyper. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
