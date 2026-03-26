import React from "react";
import { Calendar, Clock, Monitor, Users, FileText, Edit, UserPlus, BarChart, TrendingUp, Calculator, Mail, Link, Smartphone, MessageCircle, Bell } from "lucide-react";

export const TurnoSmartFeatures = () => {
  const featureSections = [
    {
      category: "Working time management",
      title: "Perfect scheduling and time tracking",
      features: [
        { title: "Staff scheduling", icon: Calendar },
        { title: "Leave & absences", icon: Clock },
        { title: "Digital time clock", icon: Monitor }
      ],
      testimonial: {
        quote: "TurnoSmart is a huge time saver, I can do 2 months of scheduling for 4 restaurants in just 1 morning.",
        author: "Franck",
        position: "Regional Director at Côté Sushi (fast food) - 20 restaurants"
      }
    },
    {
      category: "Human resources management", 
      title: "Peace of mind for the day-to-day management of your teams",
      features: [
        { title: "Employee register", icon: Users },
        { title: "Contract & amendment generation", icon: FileText },
        { title: "Electronic signatures", icon: Edit },
        { title: "Employee onboarding", icon: UserPlus }
      ],
      testimonial: {
        quote: "Electronic signatures make my life easier. I don't have to carry paper around and I can sign my documents without being on site, any time.",
        author: "Frédéric Le Troadec",
        position: "Co-founder of l'Ambassade Bretonne (traditional catering) - 8 restaurants"
      }
    },
    {
      category: "Performance monitoring",
      title: "Centralize your data in real time", 
      features: [
        { title: "HR Dashboard", icon: BarChart },
        { title: "Ratios and performance tracking", icon: TrendingUp }
      ],
      testimonial: {
        quote: "Before TurnoSmart, I had to calculate my KPIs using Excel, it was awful. Now, I can easily check turnover and absenteeism at any time.",
        author: "Aline Provenzano",
        position: "HR Director at Donjon (Jewellery and watches) 50 jewelry stores"
      }
    },
    {
      category: "Payroll preparation",
      title: "At last, reliable and one-click exports to your payroll software!",
      features: [
        { title: "Payroll preparation", icon: Calculator },
        { title: "Payslip distribution", icon: Mail },
        { title: "Integration with your payroll software", icon: Link }
      ],
      testimonial: {
        quote: "With TurnoSmart, payroll is really less painful. I no longer have any problems with payslips, no more errors. When in doubt, TurnoSmart is the peacemaker.",
        author: "Alexis Baron",
        position: "Manager of Sorbonne and St Michel Eye Centers (Healthcare) - 2 centers"
      }
    },
    {
      category: "Employee communication",
      title: "Manage teams on site or on the go",
      features: [
        { title: "Employee application", icon: Smartphone },
        { title: "Instant messaging", icon: MessageCircle },
        { title: "Schedules via SMS, app and e-mail", icon: Bell }
      ],
      testimonial: {
        quote: "With TurnoSmart, employees just have to download the app to get their info. It makes day-to-day work a lot smoother.",
        author: "Fabrizio Lavino",
        position: "Owner of Maison Laurent - 3 bakeries"
      }
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {featureSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={`${sectionIndex > 0 ? 'mt-24' : ''}`}>
            {/* Category Badge */}
            <div className="text-center mb-8">
              <span className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                {section.category}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {section.title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Features Grid */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {section.features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {feature.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Testimonial */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                  "{section.testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {section.testimonial.author}
                    </p>
                    <p className="text-sm text-gray-600">
                      {section.testimonial.position}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};