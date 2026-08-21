import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DeepDive } from "@/components/landing/DeepDive";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden bg-[var(--bg)] font-sans text-[var(--text)]">
      <AmbientBackground />
      <ScrollProgress />
      <Nav />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <DeepDive />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
