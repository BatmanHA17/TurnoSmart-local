import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Check } from "lucide-react";
import heroImage from "@/assets/hero-image.png";

export const TurnoSmartHero = () => {
  return (
    <section className="bg-gray-50 pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
            Organize your deskless workforce, from{" "}
            <span className="text-gray-700">scheduling to payroll</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto">
            HR software designed for operational teams. More visibility, compliance and 
            performance, with a tool your teams and managers will love.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button 
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-6 text-lg rounded-full h-16"
              onClick={() => {
                console.log('🚀 Start your Free Trial button clicked (Hero)');
                console.log('🧭 Navigating to /register');
                window.location.href = '/register';
              }}
            >
              Start your Free Trial
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-6 text-lg rounded-full h-16"
            >
              Get a demo
            </Button>
          </div>
          
          {/* Features */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 mb-16">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span>7 day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>Account available in 2min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">😀</span>
              <span>No commitment, no credit card</span>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <img 
              src={heroImage}
              alt="TurnoSmart HR Dashboard"
              className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl"
            />
            
            {/* Floating UI Elements */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Scheduling</span>
              </div>
            </div>
            
            <div className="absolute top-1/3 right-0 md:right-4">
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Time clock</span>
              </div>
            </div>
            
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Payroll management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};