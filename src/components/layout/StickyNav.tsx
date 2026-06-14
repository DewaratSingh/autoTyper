'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StickyNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past ~80vh
      const threshold = window.innerHeight * 0.8;
      setVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            background: 'transparent',
            borderBottom: 'none',
            boxShadow: 'none',
          }}
        >
          <div
            className="max-w-7xl mx-auto flex items-center justify-between"
            style={{ padding: '0 clamp(1.5rem, 5vw, 4rem)', height: '64px' }}
          >
            {/* Brand */}
            <a
              href="#hero"
              className="font-display font-black tracking-tighter text-xl"
              style={{ color: '#0f172a', letterSpacing: '-0.04em' }}
            >
              AUTO<span style={{ color: '#2563eb' }}>TYPER</span>
            </a>

            {/* CTA Button */}
            <a
              href="#cta"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#fff',
                borderRadius: '999px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.5)';
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              Download
            </a>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
