import { Hero } from "../../components/landing/Hero";
import { TrustBadges } from "../../components/landing/TrustBadges";
import { Features } from "../../components/landing/Features";
import { HowItWorks } from "../../components/landing/HowItWorks";
import { Integrations } from "../../components/landing/Integrations";
import { Pricing } from "../../components/landing/Pricing";
import { Stats } from "../../components/landing/Stats";
import { Testimonials } from "../../components/landing/Testimonials";
import { FAQ } from "../../components/landing/FAQ";
import { CTA } from "../../components/landing/CTA";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <TrustBadges />
      <Features />
      <HowItWorks />
      <Integrations />
      <Pricing />
      <Stats />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}
