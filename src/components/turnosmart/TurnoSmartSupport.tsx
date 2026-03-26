import React from "react";
import { GraduationCap, Headphones, Puzzle } from "lucide-react";

export const TurnoSmartSupport = () => {
  const supportItems = [
    {
      title: "Training",
      subtitle: "Easy to use",
      description: "Start at your pace: online trainings, videos, help center...",
      icon: GraduationCap,
      color: "blue"
    },
    {
      title: "Support",
      subtitle: "5-star customer support", 
      description: "For teams both large and small, we help you set off with TurnoSmart - smooth sailing.",
      icon: Headphones,
      color: "green"
    },
    {
      title: "Partners",
      subtitle: "TurnoSmart integrates with your essential tools",
      description: "Save time and avoid mistakes. TurnoSmart is integrated with your favourite solutions, from cash register to payroll.",
      icon: Puzzle,
      color: "purple"
    }
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            We care deeply and we show it
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supportItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-8 text-center hover:shadow-md transition-shadow">
                <div className={`inline-flex p-4 rounded-2xl ${getIconColor(item.color)} mb-6`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                
                <h4 className="text-lg font-semibold text-gray-700 mb-4">
                  {item.subtitle}
                </h4>
                
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};