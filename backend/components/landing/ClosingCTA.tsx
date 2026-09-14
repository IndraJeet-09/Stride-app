"use client";

import { motion } from "framer-motion";
import MagneticButton from "../motion/MagneticButton";
import Reveal from "../motion/Reveal";

export default function ClosingCTA() {
  return (
    <section className="relative py-32 px-6 lg:px-12 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(124, 58, 237, 0.15) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="max-w-[1000px] mx-auto text-center relative">
        <Reveal>
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            You already ran it.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <h3 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-12">
            Now see the{" "}
            <span className="bg-gradient-to-br from-purple-400 to-purple-500 bg-clip-text text-transparent">
              pattern.
            </span>
          </h3>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          </div>
        </Reveal>

        <Reveal delay={0.45}>
          <p className="text-sm text-muted mt-8">
            Free. No credit card. Just your running history.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
