'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Play } from 'lucide-react';

/* ─── Canvas Particle System ───────────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
  color: string;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    const colors = [
      'rgba(59,130,246,',
      'rgba(96,165,250,',
      'rgba(147,197,253,',
      'rgba(37,99,235,',
      'rgba(191,219,254,',
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.4 + Math.random() * 1.2),
        radius: 1.5 + Math.random() * 3,
        alpha: 0,
        targetAlpha: 0.3 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    resize();
    window.addEventListener('resize', resize);

    // Pre-spawn particles
    for (let i = 0; i < 50; i++) {
      spawnParticle();
      // Distribute them vertically
      particles[particles.length - 1].y = Math.random() * canvas.height;
    }

    let frameCount = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      frameCount++;
      if (frameCount % 8 === 0) spawnParticle();

      // Update + draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Fade in
        if (p.alpha < p.targetAlpha) p.alpha = Math.min(p.targetAlpha, p.alpha + 0.015);

        // Remove when off screen
        if (p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        // Fade out near top
        const fadeZone = canvas.height * 0.15;
        const displayAlpha = p.y < fadeZone ? (p.y / fadeZone) * p.alpha : p.alpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${displayAlpha.toFixed(2)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        minHeight: '100vh',
        padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 5vw, 7rem)',
        background: 'transparent',
      }}
    >
      {/* Particle background */}
      <ParticleCanvas />

      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 70% at 50% 60%, rgba(59,130,246,0.09), transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        

        {/* Big headline */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display font-black"
          style={{
            fontSize: 'clamp(2.75rem, 8vw, 7.5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: '#0f172a',
          }}
        >
          READY TO TEACH
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.3))',
            }}
          >
            WITHOUT TYPING?
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-6"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#64748b',
            maxWidth: '500px',
            lineHeight: 1.6,
          }}
        >
          Join educators who have transformed their programming classes with AutoTyper. Free to download.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          {/* Primary */}
          <a
            href="https://github.com/DewaratSingh/autoTyper/releases/download/v4.3/AutoTyper.exe"
            className="group inline-flex items-center gap-3 font-semibold rounded-2xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff',
              padding: '1rem 2.25rem',
              fontSize: '1.0625rem',
              boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(37,99,235,0.55)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(37,99,235,0.35)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Download size={20} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            Download Free
          </a>

          {/* Secondary */}
          {/* <a
            href="#demo"
            className="inline-flex items-center gap-3 font-semibold rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(59,130,246,0.06)',
              color: '#2563eb',
              padding: '1rem 2.25rem',
              fontSize: '1.0625rem',
              border: '2px solid rgba(59,130,246,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.2)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Play size={20} />
            Watch Demo
          </a> */}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex items-center justify-center gap-6 mt-10 flex-wrap"
        >
          {['Free forever', 'No account required', 'Works offline', 'Windows'].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm"
              style={{ color: '#94a3b8' }}
            >
              <span style={{ color: '#10b981' }}>✓</span>
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
