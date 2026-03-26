import { useState, useEffect } from "react";
import schedulingImage from "@/assets/onboarding-scheduling.jpg";
import teamworkImage from "@/assets/onboarding-teamwork.jpg";
import analyticsImage from "@/assets/onboarding-analytics.jpg";

interface CarouselSlide {
  id: number;
  image: string;
  title: string;
  description: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    image: teamworkImage,
    title: "Colabora con tu equipo",
    description: "Trabaja en tiempo real y mejora la coordinación del personal hotelero con herramientas de colaboración potentes."
  },
  {
    id: 2,
    image: schedulingImage,
    title: "Gestiona turnos inteligentemente", 
    description: "Organiza horarios, gestiona personal y optimiza la productividad de tu empresa hotelera con facilidad."
  },
  {
    id: 3,
    image: analyticsImage,
    title: "Analiza y planifica eficientemente",
    description: "Diseña horarios inteligentes y automatiza la gestión de turnos para maximizar la eficiencia operativa."
  }
];

export function OnboardingCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-full bg-background flex items-center justify-center p-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Main slide content */}
        <div className="relative">
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-80 object-cover rounded-xl transition-all duration-700 ease-in-out"
          />
        </div>

        {/* Slide content */}
        <div className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Progress dots - show all three with current active */}
        <div className="flex justify-center pt-4 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentSlide ? 'bg-foreground' : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}