"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

export default function CustomCursor() {
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  // Core dot — nearly instant tracking
  const dotX = useSpring(rawX, { damping: 40, stiffness: 800, mass: 0.15 });
  const dotY = useSpring(rawY, { damping: 40, stiffness: 800, mass: 0.15 });

  // Trailing ring — more smoothing
  const ringX = useSpring(rawX, { damping: 30, stiffness: 400, mass: 0.2 });
  const ringY = useSpring(rawY, { damping: 30, stiffness: 400, mass: 0.2 });

  // Velocity-based stretch for the ring
  const ringVelocityX = useVelocity(ringX);
  const rawStretch = useTransform(ringVelocityX, (v) => {
    return Math.min(Math.abs(v) * 0.012, 5);
  });
  const ringStretch = useSpring(rawStretch, { damping: 20, stiffness: 300 });
  const ringScaleX = useTransform(ringStretch, (v) => 1 + v * 0.025);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!isFinePointer || prefersReducedMotion) return;

    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.hasAttribute("data-cursor-pointer");

      setIsPointer(!!isInteractive);
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [rawX, rawY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Core dot — nearly instant tracking */}
      <motion.div
        className="fixed top-0 left-0 w-[5px] h-[5px] bg-purple-400 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isPressed ? 0.7 : 1,
        }}
        transition={{ scale: { duration: 0.1 } }}
      />

      {/* Trailing ring — subtle smoothing + velocity stretch */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border border-purple-400/40"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          scaleX: ringScaleX,
        }}
        animate={{
          width: isPointer ? 48 : 32,
          height: isPointer ? 48 : 32,
          opacity: isPointer ? 0.6 : 0.35,
        }}
        transition={{
          width: { type: "spring", damping: 25, stiffness: 300 },
          height: { type: "spring", damping: 25, stiffness: 300 },
          opacity: { duration: 0.2 },
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
            filter: "blur(6px)",
          }}
        />
      </motion.div>
    </>
  );
}
