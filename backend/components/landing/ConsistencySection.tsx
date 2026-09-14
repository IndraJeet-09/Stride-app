"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ConsistencySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const line1Opacity = useTransform(scrollYProgress, [0.1, 0.25, 0.35], [0, 1, 0.3]);
  const line1Y = useTransform(scrollYProgress, [0.1, 0.35], [40, -40]);
  const line1Blur = useTransform(scrollYProgress, [0.25, 0.35], [0, 4]);
  const line1Filter = useTransform(line1Blur, (v) => `blur(${v}px)`);

  const line2Opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.55], [0, 1, 0.3]);
  const line2Y = useTransform(scrollYProgress, [0.3, 0.55], [40, -40]);
  const line2Blur = useTransform(scrollYProgress, [0.45, 0.55], [0, 4]);
  const line2Filter = useTransform(line2Blur, (v) => `blur(${v}px)`);

  const againOpacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);
  const againY = useTransform(scrollYProgress, [0.5, 0.6], [30, 0]);

  const again2Opacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1]);
  const again2Y = useTransform(scrollYProgress, [0.6, 0.7], [30, 0]);

  const again3Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const again3Y = useTransform(scrollYProgress, [0.7, 0.8], [30, 0]);

  const finalOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);
  const finalY = useTransform(scrollYProgress, [0.8, 0.9], [40, 0]);

  const bgOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 0.15]);

  return (
    <section ref={containerRef} className="relative min-h-[300vh] py-32">
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1)_0%,transparent_70%)]" />
      </motion.div>

      <div className="sticky top-0 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-[1000px] mx-auto text-center space-y-8">
          <motion.div
            style={{ opacity: line1Opacity, y: line1Y, filter: line1Filter }}
            className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.2]"
          >
            It&apos;s not about your fastest run.
          </motion.div>

          <motion.div
            style={{ opacity: line2Opacity, y: line2Y, filter: line2Filter }}
            className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.2]"
          >
            It&apos;s about{" "}
            <span className="bg-gradient-to-br from-foreground via-purple-400 to-purple-500 bg-clip-text text-transparent">
              showing up.
            </span>
          </motion.div>

          <div className="space-y-6 pt-12">
            <motion.div
              style={{ opacity: againOpacity, y: againY }}
              className="text-6xl lg:text-8xl font-bold tracking-tight text-muted/60"
            >
              Again.
            </motion.div>

            <motion.div
              style={{ opacity: again2Opacity, y: again2Y }}
              className="text-6xl lg:text-8xl font-bold tracking-tight text-muted/60"
            >
              And again.
            </motion.div>

            <motion.div
              style={{ opacity: again3Opacity, y: again3Y }}
              className="text-6xl lg:text-8xl font-bold tracking-tight text-muted/60"
            >
              And again.
            </motion.div>
          </div>

          <motion.div
            style={{ opacity: finalOpacity, y: finalY }}
            className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.2] pt-16"
          >
            <span className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              Consistency
            </span>{" "}
            is the metric.
          </motion.div>
        </div>
      </div>
    </section>
  );
}
