"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Text3DFlipProps {
  children: string;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export default function Text3DFlip({
  children,
  className = "",
  staggerDelay = 0.03,
  initialDelay = 0,
}: Text3DFlipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  const characters = children.split("");

  return (
    <span className={`inline-block ${className}`}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{
            opacity: 0,
            rotateX: -90,
            y: 20,
            filter: "blur(6px)",
          }}
          animate={
            isVisible
              ? {
                  opacity: 1,
                  rotateX: 0,
                  y: 0,
                  filter: "blur(0px)",
                }
              : {}
          }
          transition={{
            type: "spring",
            damping: 28,
            stiffness: 180,
            delay: index * staggerDelay,
          }}
          style={{
            transformStyle: "preserve-3d",
            display: char === " " ? "inline" : "inline-block",
            whiteSpace: char === " " ? "pre" : "normal",
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}
