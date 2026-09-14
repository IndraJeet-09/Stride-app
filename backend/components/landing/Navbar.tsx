"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MagneticButton from "@/components/motion/MagneticButton";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/60 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="text-[17px] font-sans font-bold tracking-[-0.03em] text-foreground transition-all duration-200 group-hover:text-purple-400">
              STRIDE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            <Link
              href="#product"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Product
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#features"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Features
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <MagneticButton
              href="/api/v1/strava/connect"
              className="group relative px-6 py-2.5 text-sm font-medium bg-purple-500 text-white rounded-lg overflow-hidden transition-all"
            >
              <span className="relative z-10 flex items-center gap-2">
                Connect Strava
                <motion.span
                  className="inline-block"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
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
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(124, 58, 237, 0.4) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-6 space-y-4 border-t border-border">
                <Link
                  href="#product"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Product
                </Link>
                <Link
                  href="#how-it-works"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it works
                </Link>
                <Link
                  href="#features"
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <div className="pt-4 border-t border-border space-y-3">
                  <Link
                    href="/login"
                    className="block text-sm text-muted hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/api/v1/strava/connect"
                    className="block w-full px-6 py-2.5 text-sm font-medium bg-purple-500 text-white rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connect Strava ↗
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
