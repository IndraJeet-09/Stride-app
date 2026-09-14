"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Text3DFlip from "@/components/motion/Text3DFlip";
import MagneticButton from "@/components/motion/MagneticButton";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const [showShine, setShowShine] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Trigger shine effect after text animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowShine(true);
    }, 2500); // After both lines animate in
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center px-6 lg:px-12 pt-20"
    >
      {/* Background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle purple radial gradient */}
        <div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />

        {/* Faint dot grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(124, 58, 237, 0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        style={{ opacity, scale, y }}
        className="relative max-w-[1400px] mx-auto text-center"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex items-center justify-center gap-3 text-sm font-mono text-muted"
        >
          <span>STRAVA</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-purple-400"
          >
            <path
              d="M3 8H13M13 8L9 4M13 8L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>STRIDE</span>
        </motion.div>

        {/* Main headline with 3D flip animation */}
        <div className="relative mb-8">
          <h1 className="text-[clamp(3.5rem,12vw,9rem)] font-bold leading-[0.9] tracking-tight text-foreground">
            <div className="relative">
              <Text3DFlip staggerDelay={0.025} initialDelay={400}>
                Your runs.
              </Text3DFlip>
            </div>
            <div className="relative mt-2">
              <Text3DFlip staggerDelay={0.03} initialDelay={1400}>
                Your contributions.
              </Text3DFlip>
            </div>
          </h1>

          {/* Shine effect */}
          {showShine && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)",
                mixBlendMode: "overlay",
              }}
            />
          )}
        </div>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="text-[clamp(1rem,2vw,1.25rem)] text-muted max-w-2xl mx-auto mb-12 text-balance"
        >
          Turn your Strava running history into a visual record of consistency.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton
            href="/api/v1/strava/connect"
            className="group relative w-full sm:w-auto px-8 py-4 text-base font-medium bg-purple-500 text-white rounded-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Connect with Strava
              <motion.span
                className="inline-block"
                initial={{ x: 0, y: 0 }}
                whileHover={{ x: 3, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                ↗
              </motion.span>
            </span>
            <motion.div
              className="absolute inset-0 bg-purple-400"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div
              className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(124, 58, 237, 0.4) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
          </MagneticButton>

          <MagneticButton
            href="#contribution-graph"
            className="w-full sm:w-auto px-8 py-4 text-base font-medium text-foreground border border-border rounded-xl hover:border-purple-500/50 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              Explore your pattern
              <motion.span
                className="inline-block"
                initial={{ y: 0 }}
                whileHover={{ y: 3 }}
                transition={{ duration: 0.2 }}
              >
                ↓
              </motion.span>
            </span>
          </MagneticButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-border rounded-full flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-purple-400 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
