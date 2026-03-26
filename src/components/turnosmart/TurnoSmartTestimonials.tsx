import React from "react";
import { Star, Play } from "lucide-react";

export const TurnoSmartTestimonials = () => {
  const testimonials = [
    {
      quote: "A time-saving solution! I'm very satisfied with this solution, and our employees quickly got to grips with the application. The scheduling and vacation request functions save precious time in day-to-day management, especially in the catering sector.",
      author: "Natacha",
      position: "Sales and Communication Manager",
      company: "Restaurants, 11-50 employees",
      source: "Capterra",
      rating: 5,
      hasVideo: true
    },
    {
      quote: "It's a huge time-saver for me, for my managers who used to spend their afternoons solving scheduling puzzles, and for the employees who fill in their own schedules.",
      author: "Vincent Sitz", 
      position: "Director of Baltard at the Louvre",
      hasVideo: true,
      hasPhoto: true
    },
    {
      quote: "Since we installed the TurnoSmart time clock, tracking hours, clocking in and out, publishing schedules... Everything is much simpler.",
      author: "Yazu Tempaku",
      position: "CEO of Camion qui Fume", 
      hasVideo: true
    },
    {
      quote: "Fluid, intuitive application for scheduling. In the event of a problem, the help center is very reactive and solves problems directly. I highly recommend it.",
      author: "Sarkis Toumayan",
      position: "Visited in january",
      source: "Google",
      rating: 5,
      hasVideo: true
    },
    {
      quote: "Essential! I use TurnoSmart every day of the season, much to the delight of the staff, who trust it completely. Normally, it's tedious to draw up schedules, but being able to duplicate them is a real step forward. I love this software and couldn't do without it in my role as CFO.",
      author: "Marion",
      position: "President, Administrative and Financial Director",
      company: "Restaurants, 11-50 employees",
      source: "Capterra",
      rating: 5,
      hasVideo: true
    },
    {
      quote: "TurnoSmart is very easy to use and instinctive! I recommend this software for its time-saving HR administration, rapid scheduling and rapid communication to teams. In conclusion: simplicity, speed and efficiency!",
      author: "Grégoire",
      position: "Retail and HR Coordinator",
      hasVideo: true
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              {/* Source and Rating */}
              {(testimonial.source || testimonial.rating) && (
                <div className="flex items-center gap-2 mb-4">
                  {testimonial.source && (
                    <div className="flex items-center gap-2">
                      {testimonial.source === "Capterra" && (
                        <img 
                          src="https://cdn.prod.website-files.com/6422fb7d2bf3ee496eda6531/65e5d4ab5f6350d7cb4b41a6_652e97e757cc264ffb913bd4_Frame%25201430102220.svg"
                          alt="Capterra"
                          className="h-4"
                        />
                      )}
                      {testimonial.source === "Google" && (
                        <img 
                          src="https://cdn.prod.website-files.com/6422fb7d2bf3ee496eda6531/65e5d4aa87ba6fda78ac2056_652e981357e2dfdd42008a62_Rectangle%2520500%2520(1).svg"
                          alt="Google"
                          className="h-4"
                        />
                      )}
                    </div>
                  )}
                  {testimonial.rating && (
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Quote */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                {testimonial.quote.startsWith('"') ? testimonial.quote : `"${testimonial.quote}"`}
              </blockquote>
              
              {/* Author Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                  
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-gray-600">
                      {testimonial.position}
                    </p>
                    {testimonial.company && (
                      <p className="text-xs text-gray-500">
                        {testimonial.company}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Video Play Button */}
                {testimonial.hasVideo && (
                  <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
                    <Play className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};