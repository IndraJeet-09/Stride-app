"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export default function MagneticButton({
  children,
  className = "",
  href,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    const middleX = left + width / 2;
    const middleY = top + height / 2;
    const offsetX = ((clientX - middleX) / width) * 20;
    const offsetY = ((clientY - middleY) / height) * 20;

    x.set(offsetX);
    y.set(offsetY);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={ref as any}
      href={href}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={className}
      data-cursor-pointer
    >
      {children}
    </Component>
  );
}
