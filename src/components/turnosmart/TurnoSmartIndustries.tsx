import React from "react";
import { Button } from "@/components/ui/button";

export const TurnoSmartIndustries = () => {
  const industries = [
    "Hospitality",
    "Food & Grocery", 
    "Bakery",
    "Retail",
    "Sport and leisure",
    "Fast-food restaurants",
    "Traditional catering",
    "Pharmacy"
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            TurnoSmart, the right tool for your business
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {industries.map((industry, index) => (
              <Button
                key={index}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium px-6 py-2"
              >
                {industry}
              </Button>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Small or large teams
            </h3>
            <p className="text-xl text-blue-600 font-semibold">
              150,000 employees use TurnoSmart daily
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};