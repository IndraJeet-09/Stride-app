"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ContributionGraph from "./ContributionGraph";

const DEMO_ACTIVITIES = [
  { date: "2026-01-04", distance: 5.2, duration: "28:41", type: "RUN" },
  { date: "2026-01-07", distance: 7.8, duration: "41:12", type: "RUN" },
  { date: "2026-01-10", distance: 4.6, duration: "25:33", type: "RUN" },
  { date: "2026-01-14", distance: 10.2, duration: "54:18", type: "LONG RUN" },
  { date: "2026-01-17", distance: 5.9, duration: "31:22", type: "RUN" },
  { date: "2026-01-21", distance: 12.4, duration: "1:07:21", type: "TRAIL RUN" },
  { date: "2026-01-24", distance: 6.3, duration: "33:45", type: "RUN" },
  { date: "2026-01-28", distance: 8.1, duration: "43:16", type: "RUN" },
  { date: "2026-02-01", distance: 5.7, duration: "30:18", type: "RUN" },
  { date: "2026-02-04", distance: 9.4, duration: "49:52", type: "RUN" },
  { date: "2026-02-08", distance: 6.8, duration: "36:24", type: "RUN" },
  { date: "2026-02-11", distance: 11.2, duration: "59:33", type: "LONG RUN" },
  { date: "2026-02-15", distance: 5.3, duration: "28:11", type: "RUN" },
  { date: "2026-02-18", distance: 7.6, duration: "40:28", type: "RUN" },
  { date: "2026-02-22", distance: 8.9, duration: "47:15", type: "RUN" },
  { date: "2026-02-25", distance: 6.1, duration: "32:47", type: "RUN" },
  { date: "2026-03-01", distance: 10.8, duration: "57:22", type: "LONG RUN" },
  { date: "2026-03-04", distance: 5.4, duration: "29:03", type: "RUN" },
  { date: "2026-03-08", distance: 7.2, duration: "38:41", type: "RUN" },
  { date: "2026-03-11", distance: 9.1, duration: "48:36", type: "RUN" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RunToPattern() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const activityOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]);
  const activityScale = useTransform(scrollYProgress, [0.3, 0.6], [1, 0.6]);
  const activityY = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);

  const graphOpacity = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);
  const graphScale = useTransform(scrollYProgress, [0.5, 0.8], [0.9, 1]);

  const arrowOpacity = useTransform(scrollYProgress, [0.35, 0.45, 0.55], [0, 1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[200vh] py-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="sticky top-0 min-h-screen flex items-center justify-center">
          <div className="w-full grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: Narrative */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  Hundreds
                  <br />
                  of runs.
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
              />

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h3 className="text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] bg-gradient-to-br from-foreground to-purple-400 bg-clip-text text-transparent">
                  One pattern.
                </h3>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg text-muted max-w-md"
              >
                Strava shows the run. Stride shows the pattern. Watch your miles
                transform into consistency.
              </motion.p>
            </div>

            {/* Right: Transformation visualization */}
            <div className="relative min-h-[600px] flex items-center justify-center">

              {/* Activity rows — data row styling */}
              <motion.div
                style={{
                  opacity: activityOpacity,
                  scale: activityScale,
                  y: activityY,
                }}
                className="absolute inset-0 flex flex-col justify-center overflow-hidden"
              >
                {DEMO_ACTIVITIES.map((activity, idx) => (
                  <motion.div
                    key={activity.date}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.025,
                    }}
                    className="flex items-center justify-between py-3 border-b border-border/20 group"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs font-sans font-semibold tracking-wide text-foreground/70 w-20 shrink-0">
                        {activity.type}
                      </span>
                      <span className="font-mono text-sm text-foreground font-medium tabular-nums">
                        {activity.distance} km
                      </span>
                      <span className="font-mono text-xs text-muted tabular-nums">
                        {activity.duration}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted tabular-nums shrink-0">
                      {formatDate(activity.date)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Transformation arrow */}
              <motion.div
                style={{ opacity: arrowOpacity }}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <div className="w-px h-24 bg-gradient-to-b from-transparent via-purple-400/60 to-transparent" />
              </motion.div>

              {/* Contribution graph */}
              <motion.div
                style={{
                  opacity: graphOpacity,
                  scale: graphScale,
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full scale-75 origin-center">
                  <ContributionGraph />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
