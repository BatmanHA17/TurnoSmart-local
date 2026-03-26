import React from "react";
import { TurnoSmartHeader } from "./TurnoSmartHeader";
import { TurnoSmartHero } from "./TurnoSmartHero";
import { TurnoSmartSocialProof } from "./TurnoSmartSocialProof";
import { TurnoSmartPainPoints } from "./TurnoSmartPainPoints";
import { TurnoSmartFeatures } from "./TurnoSmartFeatures";
import { TurnoSmartIndustries } from "./TurnoSmartIndustries";
import { TurnoSmartTestimonials } from "./TurnoSmartTestimonials";
import { TurnoSmartSupport } from "./TurnoSmartSupport";

export const TurnoSmartLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <TurnoSmartHeader />
      <TurnoSmartHero />
      <TurnoSmartSocialProof />
      <TurnoSmartPainPoints />
      <TurnoSmartFeatures />
      <TurnoSmartIndustries />
      <TurnoSmartTestimonials />
      <TurnoSmartSupport />
    </div>
  );
};