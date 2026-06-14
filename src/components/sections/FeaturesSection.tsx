'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Keyboard,
  MousePointer2,
  FolderOpen,
  Terminal,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <Keyboard size={24} />,
    title: 'Human-Like Typing',
    description:
      'Variable delays, realistic rhythm — just like a real developer typing, not a robot.',
    color: '#3b82f6',
  },
  {
    icon: <FolderOpen size={24} />,
    title: 'Multi-File Projects',
    description:
      'Switch between files automatically. Teach entire project structures from HTML to backend.',
    color: '#0ea5e9',
  },
  {
    icon: <FileText size={24} />,
    title: 'PDF Integration',
    description:
      'Load lecture notes alongside your code. Reference theory while demonstrating practice.',
    color: '#f59e0b',
  },
  {
    icon: <RefreshCw size={24} />,
    title: 'Reusable Lectures',
    description:
      'Save your lecture scripts and reuse them. Teach the same concept perfectly every time.',
    color: '#ef4444',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 20 });
  const springY = useSpring(y, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-8deg', '8deg']);
  const glowX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    y.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 800 }}
      className="group relative"
    >
      <div
        className="relative rounded-2xl p-6 h-full transition-all duration-500 cursor-default"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(59,130,246,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, ${feature.color}18, transparent 60%)`,
          }}
        />

        {/* Border glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
          style={{
            boxShadow: `0 0 0 1px ${feature.color}30, 0 8px 32px ${feature.color}15`,
          }}
        />

        {/* Icon */}
        <div
          className="relative inline-flex items-center justify-center rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{
            width: '52px',
            height: '52px',
            background: `${feature.color}12`,
            color: feature.color,
          }}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3
          className="font-display font-bold mb-2 transition-colors duration-300"
          style={{ fontSize: '1.125rem', color: '#0f172a' }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p className="leading-relaxed" style={{ fontSize: '0.9rem', color: '#64748b' }}>
          {feature.description}
        </p>

        {/* Bottom accent */}
        <div
          className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative"
      style={{ padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 7rem)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(59,130,246,0.04), transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
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
            Everything You Need
            <br />
            To <span className="gradient-text">Teach Better</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          }}
        >
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
