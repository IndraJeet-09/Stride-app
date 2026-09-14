"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Reveal from "../motion/Reveal";
import MagneticButton from "../motion/MagneticButton";

// Deterministic pseudo-random
function seededIntensity(index: number): number {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * 6);
}

const INTENSITY_COLORS = [
  "#171720",
  "#24183A",
  "#3B1F63",
  "#5B2A91",
  "#7C3AED",
  "#A78BFA",
];

export default function ShareYourStride() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const cardY = useTransform(scrollYProgress, [0.1, 0.4], [80, 0]);
  const cardOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const cardScale = useTransform(scrollYProgress, [0.1, 0.4], [0.95, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.8], [0, 0.4, 0]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 lg:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-20">
          <Reveal>
            <h2 className="text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Share your year.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-xl text-muted max-w-lg mx-auto">
              Your miles. Your pattern. Your Stride.
            </p>
          </Reveal>
        </div>

        {/* Share Card */}
        <div className="relative max-w-[600px] mx-auto">
          {/* Ambient glow */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="absolute inset-0 blur-3xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 rounded-full scale-150 pointer-events-none"
          />

          <motion.div
            style={{ y: cardY, opacity: cardOpacity, scale: cardScale }}
            className="relative"
          >
            <div className="border border-border/40 rounded-2xl p-10 bg-surface/50 backdrop-blur-sm text-center">

              {/* Year label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xs font-mono text-muted tracking-widest uppercase mb-8"
              >
                My 2026 in Running
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center justify-center gap-12 mb-8"
              >
                <div>
                  <div className="text-4xl font-bold font-mono tabular-nums">87</div>
                  <div className="text-xs font-mono text-muted tracking-wide mt-1">RUNS</div>
                </div>
                <div className="w-px h-10 bg-border/30" />
                <div>
                  <div className="text-4xl font-bold font-mono tabular-nums">642</div>
                  <div className="text-xs font-mono text-muted tracking-wide mt-1">KM</div>
                </div>
              </motion.div>

              {/* Mini contribution grid */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-12 gap-[3px] mb-8 max-w-[360px] mx-auto"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.1, delay: 0.6 + i * 0.005 }}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: INTENSITY_COLORS[seededIntensity(i)] }}
                  />
                ))}
              </motion.div>

              {/* Streak */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-sm font-mono text-muted mb-8"
              >
                <span className="text-foreground font-semibold">23</span> day streak
              </motion.div>

              {/* Brand */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-sm font-bold tracking-[-0.03em] text-foreground/60"
              >
                STRIDE
              </motion.div>
            </div>
          </motion.div>

          {/* CTA */}
          <Reveal delay={0.9}>
            <div className="text-center mt-12">
              <MagneticButton
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-foreground border border-border rounded-xl hover:border-purple-500/50 transition-all group"
              >
                <span>Share your Stride</span>
                <motion.span
                  className="inline-block"
                  initial={{ x: 0, y: 0 }}
                  whileHover={{ x: 3, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  ↗
                </motion.span>
              </MagneticButton>
              <p className="text-xs text-muted mt-4">Coming soon</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
