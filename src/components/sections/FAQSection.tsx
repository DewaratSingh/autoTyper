'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'What is AutoTyper?',
    a: 'AutoTyper is a tool built for programming educators that automatically types your pre-written code during live lectures. Instead of typing manually (with mistakes) or pasting code (with no teaching value), AutoTyper reveals code character-by-character — naturally, at lecture pace — with a single key press.',
  },
  {
    q: 'Why not just paste the code?',
    a: "Pasting code shows students the final output but hides the process. Programming education is about understanding how code is built, not what it looks like. AutoTyper reveals code progressively, the way it's actually written — letting students follow the thought process in real time.",
  },
  {
    q: 'Can I switch between multiple files?',
    a: 'Absolutely. AutoTyper supports multi-file projects. You can teach an entire project — index.html, style.css, app.js, server.js, auth.js — and the tool will automatically switch file tabs at the right points in your lecture sequence.',
  },
  {
    q: 'Does it work with VS Code?',
    a: 'AutoTyper is designed to work alongside VS Code and other editors. It can type into any text editor window. You can also use the built-in editor view, which is styled exactly like VS Code for a familiar teaching environment.',
  },
  {
    q: 'Can I reuse the same lecture?',
    a: "Yes. Save your lecture as a project file and reuse it any time. This means you can teach the same content multiple times — perfectly, consistently, without any effort. Great for repeated cohorts or recorded sessions.",
  },
];

function FAQItem({ item, index }: { item: (typeof faqs)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: open ? 'rgba(59,130,246,0.03)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${open ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.07)'}`,
          boxShadow: open
            ? '0 4px 24px rgba(59,130,246,0.08)'
            : '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Question */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left transition-colors duration-200"
          style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)' }}
        >
          <span
            className="font-display font-semibold pr-4"
            style={{
              fontSize: 'clamp(0.9375rem, 1.8vw, 1.0625rem)',
              color: open ? '#1d4ed8' : '#0f172a',
              lineHeight: 1.4,
            }}
          >
            {item.q}
          </span>
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: '32px',
              height: '32px',
              background: open ? 'rgba(37,99,235,0.1)' : 'rgba(59,130,246,0.06)',
              color: open ? '#2563eb' : '#94a3b8',
              transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
            }}
          >
            {open ? <Minus size={16} /> : <Plus size={16} />}
          </div>
        </button>

        {/* Answer */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div
                style={{
                  padding: '0 clamp(1rem, 2.5vw, 1.5rem) clamp(1rem, 2.5vw, 1.5rem)',
                  borderTop: '1px solid rgba(59,130,246,0.08)',
                }}
              >
                <p
                  className="leading-relaxed"
                  style={{
                    paddingTop: '1rem',
                    fontSize: '0.9375rem',
                    color: '#475569',
                    lineHeight: 1.7,
                  }}
                >
                  {item.a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="relative"
      style={{ padding: 'clamp(5rem, 12vw, 10rem) clamp(1.5rem, 5vw, 7rem)' }}
    >
      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
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
            Frequently Asked
            <br />
            <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} item={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
