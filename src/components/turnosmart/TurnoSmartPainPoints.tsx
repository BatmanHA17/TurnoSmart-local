import React from "react";
import { AlertCircle, FileX, Eye, Zap } from "lucide-react";

export const TurnoSmartPainPoints = () => {
  const painPoints = [
    {
      icon: AlertCircle,
      text: "My Excel work schedules are not compliant, not optimized, hard to share"
    },
    {
      icon: FileX,
      text: "Impossible to find the right HR document at the right time"
    },
    {
      icon: Eye,
      text: "I don't know what's going on in the field"
    },
    {
      icon: Zap,
      text: "Our teams are tired of using overly complex tools"
    }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Does it sound familiar?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {painPoints.map((point, index) => {
              const IconComponent = point.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      "{point.text}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-xl text-gray-600 font-medium">
              All this wasted time and money...
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Do you want to move up a gear?
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};