import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DashboardSection from "@/components/DashboardSection";
import ResultsSection from "@/components/ResultsSection";
import UploadSection from "@/components/UploadSection";
import ClosingSection from "@/components/ClosingSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <ProblemSection />
    <SolutionSection />
    <HowItWorksSection />
    <DashboardSection />
    <ResultsSection />
    <UploadSection />
    <ClosingSection />
    <PricingSection />
    <FooterSection />
  </div>
);

export default Index;
