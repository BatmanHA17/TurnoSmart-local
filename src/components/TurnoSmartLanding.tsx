import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
/* Cache invalidation fix 2024 */
import { Button } from "@/components/ui/button";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  X, 
  ArrowRight, 
  Users, 
  Calendar, 
  BarChart3, 
  Shield, 
  Clock, 
  Zap,
  CheckCircle,
  Star,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const navigation = [
  { name: 'Producto', href: '#producto' },
  { name: 'Soluciones', href: '#soluciones' },
  { name: 'Recursos', href: '#recursos' },
  { name: 'Precios', href: '#precios' },
];

const features = [
  {
    icon: Calendar,
    title: "Planificación Inteligente",
    description: "Algoritmos avanzados que optimizan automáticamente los horarios según la ocupación del hotel y las normativas laborales españolas."
  },
  {
    icon: Users,
    title: "Gestión de Personal",
    description: "Control total sobre contratos, categorías profesionales y unidades de tiempo para maximizar la eficiencia operativa."
  },
  {
    icon: Shield,
    title: "Cumplimiento Normativo",
    description: "Garantiza el cumplimiento automático de la legislación laboral española, convenios colectivos y días de descanso obligatorios."
  },
  {
    icon: BarChart3,
    title: "Análisis y Reporting",
    description: "Dashboards intuitivos con métricas clave de productividad, costes laborales y optimización de plantilla."
  },
  {
    icon: Clock,
    title: "Ahorro de Tiempo",
    description: "Reduce hasta un 75% el tiempo dedicado a planificación manual de turnos y gestión de horarios."
  },
  {
    icon: Zap,
    title: "Automatización Total",
    description: "Desde la asignación de turnos hasta el cálculo de ratios de ocupación por departamento hotelero."
  }
];

const testimonials = [
  {
    quote: "TurnoSmart ha revolucionado nuestra gestión de personal. Ahorramos 15 horas semanales en planificación y hemos mejorado significativamente el cumplimiento normativo.",
    author: "Carlos Mendoza",
    role: "Director de RRHH, Hotel Costa del Sol",
    rating: 5
  },
  {
    quote: "La funcionalidad de cálculo automático de plantilla según ocupación es impresionante. Nos ha permitido optimizar costes sin comprometer la calidad del servicio.",
    author: "María González",
    role: "Gerente General, Resort Las Palmas",
    rating: 5
  },
  {
    quote: "Imprescindible para cualquier hotel que quiera cumplir con la normativa laboral sin complicaciones. La interfaz es muy intuitiva y el soporte técnico excelente.",
    author: "Ana Martín",
    role: "Jefe de Bares, Hotel Mediterráneo",
    rating: 5
  }
];

export function TurnoSmartLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const stats = [
    { value: "500+", label: "Hoteles confían en nosotros" },
    { value: "15k+", label: "Empleados gestionados" },
    { value: "99.8%", label: "Cumplimiento normativo" },
    { value: "40%", label: "Reducción tiempo planificación" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <TurnoSmartLogo size="md" />
              <span className="text-xl font-semibold text-foreground">TurnoSmart</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300 text-foreground hover:bg-muted/50"
                onClick={() => navigate('/auth')}
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 bg-[#0F62FE] text-white hover:bg-[#0F62FE]/90"
                onClick={() => navigate('/register')}
              >
                Probar Gratis
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background">
            <div className="px-4 py-4 space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-gray-300 text-foreground hover:bg-muted/50"
                  onClick={() => navigate('/auth')}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-300 bg-[#0F62FE] text-white hover:bg-[#0F62FE]/90"
                  onClick={() => navigate('/register')}
                >
                  Probar Gratis
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm font-medium text-muted-foreground border border-border/50">
              <Zap className="h-4 w-4" />
              Cumplimiento automático normativa española
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Gestión de personal
                <br />
                para hostelería
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                TurnoSmart automatiza la planificación de horarios, garantiza el cumplimiento de la normativa laboral y optimiza tu equipo según la ocupación hotelera.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="flex items-center gap-2 border border-gray-300 bg-[#0F62FE] text-white hover:bg-[#0F62FE]/90"
                onClick={() => navigate('/register')}
              >
                Empezar gratis ahora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-300 text-foreground hover:bg-muted/50"
                onClick={() => navigate('/auth')}
              >
                Hablar con ventas
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Prueba gratuita de 14 días • No se requiere tarjeta de crédito
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <p className="text-sm font-medium text-muted-foreground">
              Confían en TurnoSmart más de 500 hoteles en España
            </p>
            
            {/* Hotel Logos/Names */}
            <div className="flex justify-center items-center gap-8 lg:gap-12 text-muted-foreground">
              <span className="text-lg font-medium">Hotel Canarias</span>
              <span className="text-lg font-medium">Resort Mediterráneo</span>
              <span className="text-lg font-medium">Palace Hotels</span>
              <span className="text-lg font-medium">Costa Dorada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="producto" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Todo lo que necesitas para gestionar tu personal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde la planificación automática hasta el análisis de productividad, TurnoSmart te ayuda a optimizar cada aspecto de la gestión de personal hotelero.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Más de 500 hoteles confían en TurnoSmart para optimizar su gestión de personal
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="space-y-4 p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Empieza a optimizar tu gestión de personal hoy
            </h2>
            <p className="text-lg text-muted-foreground">
              Únete a más de 500 hoteles que ya han transformado su operativa con TurnoSmart
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="flex items-center gap-2 border border-gray-300 bg-[#0F62FE] text-white hover:bg-[#0F62FE]/90"
              onClick={() => navigate('/register')}
            >
              Empezar gratis ahora
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-gray-300 text-foreground hover:bg-muted/50"
              onClick={() => navigate('/auth')}
            >
              Hablar con ventas
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Prueba gratuita de 14 días • No se requiere tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TurnoSmartLogo size="sm" />
                <span className="text-lg font-semibold text-foreground">TurnoSmart</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La solución integral para la gestión de personal hotelero que garantiza el cumplimiento normativo y optimiza la productividad.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Producto</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Planificación</a>
                <a href="#" className="block hover:text-foreground transition-colors">Análisis</a>
                <a href="#" className="block hover:text-foreground transition-colors">Reportes</a>
                <a href="#" className="block hover:text-foreground transition-colors">Integraciones</a>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Empresa</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Sobre nosotros</a>
                <a href="#" className="block hover:text-foreground transition-colors">Casos de éxito</a>
                <a href="#" className="block hover:text-foreground transition-colors">Blog</a>
                <a href="#" className="block hover:text-foreground transition-colors">Contacto</a>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Contacto</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>hola@turnosmart.es</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+34 900 123 456</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Madrid, España</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 TurnoSmart. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}