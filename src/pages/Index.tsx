import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import DashboardSection from "@/components/DashboardSection";
import ResultsSection from "@/components/ResultsSection";
import UploadSection from "@/components/UploadSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <ProblemSection />
    <SolutionSection />
    <DashboardSection />
    <ResultsSection />
    <UploadSection />
    <PricingSection />
    <FooterSection />
  </div>
);

export default Index;
