"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

/* ─── Syntax Highlighter ───────────────────────────────────────────────────── */
function highlightCode(code: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "";

  // Escape HTML first
  let safe = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (ext === "html") {
    safe = safe
      .replace(/(&lt;\/?[\w-]+)/g, '<span class="code-tag">$1</span>')
      .replace(/([\w-]+=)/g, '<span class="code-attr">$1</span>')
      .replace(
        /(&quot;[^&]*&quot;|"[^"]*")/g,
        '<span class="code-value">$1</span>',
      );
    return safe;
  }

  if (ext === "css") {
    safe = safe
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="code-class">$1</span>{')
      .replace(/:\s*([^;{\n]+)/g, ': <span class="code-value">$1</span>');
    return safe;
  }

  // JS / generic
  safe = safe
    .replace(/(\/\/[^\n]*)/g, '<span class="code-comment">$1</span>')
    .replace(
      /\b(const|let|var|function|async|await|return|if|else|try|catch|new|require|module\.exports)\b/g,
      '<span class="code-keyword">$1</span>',
    )
    .replace(
      /\b(true|false|null|undefined)\b/g,
      '<span class="code-number">$1</span>',
    )
    .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
    .replace(
      /(`[^`]*`|'[^']*'|"[^"]*")/g,
      '<span class="code-string">$1</span>',
    )
    .replace(/\b([\w]+)\s*\(/g, '<span class="code-function">$1</span>(');

  return safe;
}

/* ─── File Icon ─────────────────────────────────────────────────────────────── */
function fileIcon(name: string) {
  const ext = name.split(".").pop();
  const colors: Record<string, string> = {
    html: "#e34c26",
    css: "#264de4",
    js: "#f7df1e",
    ts: "#007acc",
  };
  const color = colors[ext ?? ""] ?? "#94a3b8";
  return (
    <span
      className="text-xs font-bold px-1 rounded mr-1"
      style={{ background: color + "22", color }}
    >
      {ext?.toUpperCase()}
    </span>
  );
}

/* ─── Main Demo Component ──────────────────────────────────────────────────── */
export default function DemoSection() {
 

  return (
    <section
      id="demo"
      className="relative"
      style={{
        padding: "clamp(5rem, 10vw, 8rem) clamp(1.5rem, 5vw, 7rem)",
        background: "transparent",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(59,130,246,0.06), transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2
            className="font-display font-black"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              letterSpacing: "-0.03em",
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            Try <span className="gradient-text">AutoTyper</span>
          </h2>
          <p
            className="mt-4 mx-auto"
            style={{
              color: "#64748b",
              fontSize: "1.0625rem",
              maxWidth: "440px",
            }}
          >
            Press{" "}
            <kbd
              className="inline-flex items-center rounded-lg font-mono font-bold px-3 py-1"
              style={{
                background: "#1e293b",
                color: "#60a5fa",
                fontSize: "0.9rem",
                border: "2px solid rgba(96,165,250,0.3)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.5)",
              }}
            >
              F8
            </kbd>{" "}
            to start • Press again to pause
          </p>
        </motion.div>

        {/* VS Code Editor */}
        <div className="relative">
          <div
            className="
      absolute
      -inset-8
      bg-blue-500/20
      blur-3xl
      rounded-[40px]
    "
          />

          <Image
            src="/screen.png"
            alt="AutoTyper Screenshot"
            width={1600}
            height={900}
            className="
      relative
      rounded-[32px]
      border
      border-slate-200
      shadow-[0_40px_120px_rgba(0,0,0,.15)]
    "
          />
        </div>
      </div>
    </section>
  );
}
