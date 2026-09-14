import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/motion/ScrollProgress";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import RunToPattern from "@/components/landing/RunToPattern";
import YearInRunning from "@/components/landing/YearInRunning";
import ConsistencySection from "@/components/landing/ConsistencySection";
import StrideProfileShowcase from "@/components/landing/StrideProfileShowcase";
import ShareYourStride from "@/components/landing/ShareYourStride";
import ClosingCTA from "@/components/landing/ClosingCTA";
import SectionDivider from "@/components/landing/SectionDivider";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <main className="min-h-screen">
        <Navbar />
        <Hero />

        <SectionDivider />

        <RunToPattern />

        <SectionDivider />

        <YearInRunning />

        <SectionDivider />

        <ConsistencySection />

        <SectionDivider />

        <StrideProfileShowcase />

        <SectionDivider />

        <ShareYourStride />

        <SectionDivider />

        <ClosingCTA />

        <Footer />
      </main>
    </>
  );
}
