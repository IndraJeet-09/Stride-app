"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Reveal from "../motion/Reveal";

// Deterministic pseudo-random based on index
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

const RECENT_RUNS = [
  { distance: "8.42", date: "Sep 14" },
  { distance: "5.17", date: "Sep 13" },
  { distance: "12.04", date: "Sep 11" },
];

export default function StrideProfileShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const profileY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const graphY = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 0.5, 0]);

  return (
    <section ref={containerRef} className="relative py-32 px-6 lg:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-20">
          <Reveal>
            <h2 className="text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your running profile.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-xl text-muted">
              A profile built from your miles.
            </p>
          </Reveal>
        </div>

        {/* Profile Card */}
        <motion.div
          style={{ y: profileY }}
          className="relative max-w-[900px] mx-auto"
        >
          {/* Ambient glow */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="absolute inset-0 blur-3xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 rounded-full scale-150 pointer-events-none"
          />

          <Reveal delay={0.3}>
            <div className="relative border border-border/40 rounded-2xl p-8 lg:p-12 bg-surface/40 backdrop-blur-sm">

              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-10 pb-8 border-b border-border/20"
              >
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                      INDRAJEET
                    </h3>
                    <div className="text-sm font-mono text-muted tracking-widest uppercase">
                      Runner
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-white">I</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: "642", label: "KM" },
                    { value: "87", label: "RUNS" },
                    { value: "23", label: "DAY STREAK" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {stat.value}
                      </div>
                      <div className="text-xs font-mono text-muted tracking-wide mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Contribution Graph Preview — deterministic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                style={{ y: graphY }}
                className="mb-10"
              >
                <div className="text-xs font-mono text-muted mb-4 tracking-widest uppercase">
                  2026 Contribution Graph
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 84 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.15,
                        delay: 0.7 + i * 0.004,
                      }}
                      className="aspect-square rounded-sm"
                      style={{ backgroundColor: INTENSITY_COLORS[seededIntensity(i)] }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Insights Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="grid grid-cols-2 gap-8 mb-10"
              >
                <div>
                  <div className="text-xs font-mono text-muted mb-2 tracking-widest uppercase">
                    Most Consistent
                  </div>
                  <div className="text-xl font-semibold">August 2026</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-muted mb-2 tracking-widest uppercase">
                    Longest Streak
                  </div>
                  <div className="text-xl font-semibold">41 Days</div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <div className="text-xs font-mono text-muted mb-4 tracking-widest uppercase">
                  Recent Activity
                </div>
                <div className="space-y-0">
                  {RECENT_RUNS.map((run, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 1.1 + idx * 0.1 }}
                      className="flex items-center justify-between py-3 border-b border-border/15 last:border-0"
                    >
                      <span className="font-mono text-sm tabular-nums">
                        {run.distance} km
                      </span>
                      <span className="text-xs font-mono text-muted tabular-nums">
                        {run.date}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
