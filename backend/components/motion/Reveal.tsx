"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  blur?: boolean;
  className?: string;
}

export default function Reveal({
  children,
  delay = 0,
  duration = 0.6,
  blur = false,
  className = "",
}: RevealProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
        filter: blur ? "blur(6px)" : "blur(0px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
