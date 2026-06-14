'use client';

import React from 'react';

export default function AnimatedGradientBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#f8fafc] pointer-events-none">
      {/* Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] md:w-[45vw] md:h-[45vw] rounded-full bg-blue-300/20 blur-[130px] animate-blob-one pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[55vw] h-[55vw] md:w-[40vw] md:h-[40vw] rounded-full bg-indigo-200/20 blur-[130px] animate-blob-two pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[65vw] h-[65vw] md:w-[50vw] md:h-[50vw] rounded-full bg-cyan-200/20 blur-[130px] animate-blob-three pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-[50vw] h-[50vw] md:w-[35vw] md:h-[35vw] rounded-full bg-violet-300/15 blur-[130px] animate-blob-four pointer-events-none" />

      {/* Ambient Radial Gradient Fade to guarantee high legibility & contrast */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.6) 70%, #f8fafc 100%)',
        }}
      />

      {/* Organic Noise Texture Overlay for premium look */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />
    </div>
  );
}
