"use client";

import { motion } from "framer-motion";
import CountUp from "../motion/CountUp";
import Reveal from "../motion/Reveal";

// Demo data for landing page
const STATS = {
  runs: 87,
  distance: 642,
  movingTime: 48,
  streak: 23,
};

const INSIGHTS = [
  { label: "MOST ACTIVE MONTH", value: "August" },
  { label: "LONGEST RUN", value: "18.4 km" },
  { label: "BEST STREAK", value: "41 days" },
  { label: "MOST CONSISTENT DAY", value: "Sunday" },
];

const MONTHLY_DATA = [
  { month: "Jan", runs: 12 },
  { month: "Feb", runs: 15 },
  { month: "Mar", runs: 18 },
  { month: "Apr", runs: 8 },
  { month: "May", runs: 14 },
  { month: "Jun", runs: 16 },
  { month: "Jul", runs: 19 },
  { month: "Aug", runs: 22 },
  { month: "Sep", runs: 11 },
  { month: "Oct", runs: 0 },
  { month: "Nov", runs: 0 },
  { month: "Dec", runs: 0 },
];

export default function YearInRunning() {
  const maxRuns = Math.max(...MONTHLY_DATA.map((d) => d.runs));

  return (
    <section className="relative py-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">

        {/* Heading */}
        <Reveal>
          <h2 className="text-6xl lg:text-7xl font-bold tracking-tight mb-24">
            Your year in running.
          </h2>
        </Reveal>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-24">
          <Reveal delay={0.1}>
            <div className="space-y-3">
              <div className="text-6xl lg:text-7xl font-bold font-mono tracking-tight">
                <CountUp target={STATS.runs} />
              </div>
              <div className="text-sm font-mono font-medium text-muted tracking-wide">
                RUNS
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="space-y-3">
              <div className="text-6xl lg:text-7xl font-bold font-mono tracking-tight">
                <CountUp target={STATS.distance} />
              </div>
              <div className="text-sm font-mono font-medium text-muted tracking-wide">
                KM
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="space-y-3">
              <div className="text-6xl lg:text-7xl font-bold font-mono tracking-tight">
                <CountUp target={STATS.movingTime} />
                <span className="text-muted">h</span>
              </div>
              <div className="text-sm font-mono font-medium text-muted tracking-wide">
                MOVING TIME
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="space-y-3">
              <div className="text-6xl lg:text-7xl font-bold font-mono tracking-tight">
                <CountUp target={STATS.streak} />
              </div>
              <div className="text-sm font-mono font-medium text-muted tracking-wide">
                DAY STREAK
              </div>
            </div>
          </Reveal>
        </div>

        {/* Divider */}
        <Reveal delay={0.5}>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-24" />
        </Reveal>

        {/* Monthly Activity Visualization + Insights */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Monthly bars */}
          <Reveal delay={0.6}>
            <div className="space-y-6">
              <h3 className="text-sm font-mono font-semibold tracking-wide text-muted mb-8">
                MONTHLY ACTIVITY
              </h3>
              <div className="space-y-4">
                {MONTHLY_DATA.map((month, idx) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted w-8">
                      {month.month}
                    </span>
                    <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(month.runs / maxRuns) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          delay: 0.6 + idx * 0.05,
                          ease: [0.21, 0.47, 0.32, 0.98],
                        }}
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted w-8 text-right">
                      {month.runs > 0 ? month.runs : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Secondary insights */}
          <div className="space-y-8">
            {INSIGHTS.map((insight, idx) => (
              <Reveal key={insight.label} delay={0.7 + idx * 0.1}>
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold tracking-wide text-muted">
                    {insight.label}
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {insight.value}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
