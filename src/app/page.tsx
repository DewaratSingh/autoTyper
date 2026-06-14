import StickyNav from '@/components/layout/StickyNav';
import IntroSection from '@/components/sections/IntroSection';
import BallCollisionSection from '@/components/sections/BallCollisionSection';
import ProblemSection from '@/components/sections/ProblemSection';
import BigStatement from '@/components/sections/BigStatement';
import DemoSection from '@/components/sections/DemoSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import AboutSection from '@/components/sections/AboutSection';
import FooterSection from '@/components/sections/FooterSection';

export default function Home() {
  return (
    <>
      <StickyNav />
      <main>
        <IntroSection />
        <BallCollisionSection />
        <ProblemSection />
        <BigStatement />
        <DemoSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
        <AboutSection />
      </main>
      <FooterSection />
    </>
  );
}
