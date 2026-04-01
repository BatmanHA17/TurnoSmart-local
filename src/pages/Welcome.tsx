/**
 * Welcome — Landing de bienvenida para empleado recién invitado
 * Se muestra una sola vez tras aceptar la invitación.
 * localStorage key: turnosmart_welcome_seen_${userId}
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { displayName } = useUserProfile();
  const { org } = useCurrentOrganization();
  const [step, setStep] = useState(0);

  // Mark as seen so it doesn't show again
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`turnosmart_welcome_seen_${user.id}`, "true");
    }
  }, [user?.id]);

  const steps = [
    {
      icon: Calendar,
      title: "Consulta tu horario",
      description: "En la sección 'Mi Horario' verás tu cuadrante semanal con todos tus turnos asignados.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: FileText,
      title: "Envía peticiones",
      description: "Desde 'Mis Peticiones' puedes solicitar vacaciones, preferencias de turno o intercambios con compañeros.",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Sparkles,
      title: "Todo se sincroniza",
      description: "Tus peticiones llegan al responsable y se tienen en cuenta al generar los próximos cuadrantes.",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Bienvenido/a{displayName ? `, ${displayName}` : ""} 👋
          </h1>
          {org?.name && (
            <p className="text-muted-foreground text-lg">
              Te has unido al equipo de <span className="font-semibold text-foreground">{org.name}</span>
            </p>
          )}
        </div>

        {/* Mini tour cards */}
        <div className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className={`p-4 text-left transition-all duration-300 ${
                  i <= step ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2"
                }`}
                onClick={() => setStep(Math.max(step, i))}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="gap-2 w-full sm:w-auto"
          onClick={() => navigate("/turnosmart")}
        >
          Ver mi calendario
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-[10px] text-muted-foreground">
          TurnoSmart® · Gestión inteligente de turnos
        </p>
      </div>
    </div>
  );
}
