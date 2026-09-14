import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stride — Your runs. Your contributions.",
  description: "Turn your Strava running history into a visual record of consistency.",
  keywords: ["running", "strava", "fitness", "tracking", "contribution graph", "streaks"],
  openGraph: {
    title: "Stride — Your runs. Your contributions.",
    description: "Turn your Strava running history into a visual record of consistency.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
