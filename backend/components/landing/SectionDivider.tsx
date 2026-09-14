"use client";

import { motion } from "framer-motion";

interface SectionDividerProps {
  className?: string;
}

export default function SectionDivider({ className = "" }: SectionDividerProps) {
  return (
    <div className={`relative py-4 px-6 lg:px-12 ${className}`}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="h-px bg-gradient-to-r from-transparent via-border to-transparent origin-center"
        />
      </div>
    </div>
  );
}
