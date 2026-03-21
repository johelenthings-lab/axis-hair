import NavbarLanding from "@/components/landing/NavbarLanding";
import HeroLanding from "@/components/landing/HeroLanding";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorksLanding from "@/components/landing/HowItWorksLanding";
import ForStylistsSection from "@/components/landing/ForStylistsSection";
import WhatClientsExperienceSection from "@/components/landing/WhatClientsExperienceSection";
import AppPreviewSection from "@/components/landing/AppPreviewSection";
import TrustSection from "@/components/landing/TrustSection";
import FooterLanding from "@/components/landing/FooterLanding";
import FAQSection from "@/components/FAQSection";
import PricingSection from "@/components/PricingSection";
import DashboardSection from "@/components/DashboardSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavbarLanding />
      <HeroLanding />
      <ProblemSection />
      <SolutionSection />
      <DashboardSection />
      <HowItWorksLanding />
      <ForStylistsSection />
      <AppPreviewSection />
      <TrustSection />
      <FAQSection />
      <PricingSection />
      <FooterLanding />
    </div>
  );
};

export default Landing;
