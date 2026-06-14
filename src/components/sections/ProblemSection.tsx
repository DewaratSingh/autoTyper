'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ProblemCardProps {
  title: string;
  description: string;
  index: number;
  visual: React.ReactNode;
}

function ProblemCard({ title, description, index, visual }: ProblemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-12deg', '12deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    y.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      className="group relative rounded-3xl overflow-hidden cursor-pointer"
    >
      <div
        className="relative h-full glass-card rounded-3xl glow-box transition-all duration-500 glow-box-hover"
        style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}
      >
        {/* Glow orb behind card on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12), transparent 60%)',
          }}
        />

        {/* Visual area */}
        <div
          className="relative rounded-2xl mb-6 overflow-hidden flex items-center justify-center"
          style={{
            height: '180px',
            background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 100%)',
            border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          {visual}
        </div>

        {/* Card content */}
        <h3
          className="font-display font-bold mb-3"
          style={{ fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', color: '#0f172a' }}
        >
          {title}
        </h3>
        <p
          className="font-sans leading-relaxed"
          style={{ fontSize: '0.9375rem', color: '#64748b' }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Animated Visuals ────────────────────────────────────────────────────── */
function TypingErrorVisual() {
  const [showError] = useState(true);
  return (
    <div
      className="w-full h-full p-4 rounded-xl font-mono text-xs"
      style={{ background: '#1e293b', color: '#e2e8f0' }}
    >
      <div className="flex gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28ca41' }} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span style={{ color: '#c792ea' }}>function</span>
          <span style={{ color: '#82aaff' }}> calcualte</span>
          <span style={{ color: '#89ddff' }}>()</span>
          <span
            className="ml-1 text-xs px-1 rounded"
            style={{
              background: showError ? 'rgba(239,68,68,0.2)' : 'transparent',
              color: '#ef4444',
              textDecoration: 'underline',
              textDecorationColor: '#ef4444',
              animation: 'glow-pulse 2s ease-in-out infinite',
            }}
          >
            ⚠
          </span>
        </div>
        <div style={{ color: '#64748b' }}>{'  // typo: calcualte'}</div>
        <div>
          <span style={{ color: '#89ddff' }}>{'  return '}</span>
          <span style={{ color: '#f78c6c' }}>42</span>
          <span style={{ color: '#89ddff' }}>;</span>
        </div>
        <div className="mt-2 px-2 py-1 rounded text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          ✗ TypoError: calcualte is not defined
        </div>
        <div style={{ color: '#475569', fontSize: '0.7rem' }}>Students fall behind...</div>
      </div>
    </div>
  );
}

function PreWrittenCodeVisual() {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <div
        className="w-full h-full p-4 rounded-xl font-mono text-xs"
        style={{ background: '#1e293b', color: '#e2e8f0' }}
      >
        <div className="space-y-1" style={{ animation: 'fade-in 0.3s ease-out' }}>
          {['const app = require("express")()', 'const db = mongoose.connect(uri)', 'app.use(express.json())', 'app.get("/", handler)', 'app.listen(3000)'].map((line, i) => (
            <div key={i} style={{ color: i % 2 === 0 ? '#c792ea' : '#c3e88d', opacity: 1 - i * 0.05 }}>
              {line}
            </div>
          ))}
        </div>
        {/* Floating question marks */}
        {['?', '?', '?'].map((q, i) => (
          <div
            key={i}
            className="absolute font-bold text-lg"
            style={{
              color: '#f59e0b',
              right: `${20 + i * 25}%`,
              top: `${20 + i * 20}%`,
              animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {q}
          </div>
        ))}
      </div>
    </div>
  );
}

function LostProcessVisual() {
  const blocks = [
    { label: 'Think', x: '10%', y: '20%', delay: 0 },
    { label: 'Plan', x: '60%', y: '10%', delay: 0.2 },
    { label: 'Build', x: '30%', y: '60%', delay: 0.4 },
    { label: 'Debug', x: '65%', y: '55%', delay: 0.6 },
  ];

  return (
    <div className="relative w-full h-full">
      {blocks.map((block) => (
        <div
          key={block.label}
          className="absolute px-3 py-1 rounded-lg text-xs font-medium font-mono"
          style={{
            left: block.x,
            top: block.y,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.2)',
            color: '#3b82f6',
            animation: `float ${3 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${block.delay}s`,
          }}
        >
          {block.label}
        </div>
      ))}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs px-3 py-2 rounded-lg"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#94a3b8', border: '1px dashed rgba(239,68,68,0.2)' }}
      >
        Where do I even start?
      </div>
    </div>
  );
}

export default function ProblemSection() {
  const cards = [
    {
      title: 'Live Typing Mistakes',
      description:
        'Teachers make typos live. Red errors flash. Debugging derails the entire lecture while students wait, confused and disengaged.',
      visual: <TypingErrorVisual />,
    },
    {
      title: 'Pre-Written Code',
      description:
        'Pasting complete code robs students of the building process. They see the final product, never the journey.',
      visual: <PreWrittenCodeVisual />,
    },
    {
      title: 'Lost Learning Process',
      description:
        "Students struggle with the thinking process, not the syntax. The how and why of code structure is never shown.",
      visual: <LostProcessVisual />,
    },
  ];

  return (
    <section
      id="problem"
      className="relative"
      style={{ padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 7rem)' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(239,246,255,0.8), transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-20"
        >
          
          <h2
            className="font-display font-black"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: 1.1,
            }}
          >
            The Problem With
            <br />
            <span className="gradient-text">Programming Classes</span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          }}
        >
          {cards.map((card, i) => (
            <ProblemCard key={card.title} {...card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
