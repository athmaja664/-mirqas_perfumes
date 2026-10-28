"use client";

import TrustBenefits from "@/components/TrustBenefits";
import PerfumeCategorySection from "@/components/PerfumeCategorySection";
import CollectionShowcase from "@/components/CollectionShowcase";
import BrandStorySection from "@/components/BrandStorySection";

import VideoShowcase from "@/components/VideoShowcase";
import ChooseYourBottle from "@/components/Chooseyourbottle";
import FaqSection from "@/components/FaqSection";
import HeroCarousel from "@/components/HeroCarousel";

const sans = "Inter, system-ui, sans-serif";

export default function Home() {
  return (
    <main style={{ fontFamily: sans }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap");
        html, body { margin: 0; overflow-x: hidden; }
      `}</style>

      <HeroCarousel />

      
      <PerfumeCategorySection />
      <CollectionShowcase />
      <ChooseYourBottle />
      <BrandStorySection />
      <VideoShowcase />
      <FaqSection />
      <TrustBenefits />
    </main>
  );
}