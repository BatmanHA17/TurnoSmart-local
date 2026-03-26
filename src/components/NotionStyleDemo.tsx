import React from "react";
import { ContentContainer, PageHeader, Section, TextContent } from "@/components/ui/content-layout";
import { NotionCard, StatCard, InfoPanel, ListItem } from "@/components/ui/notion-components";
import { EmptyState, WorkIllustration, CalendarIllustration, TeamIllustration } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users, Calendar, TrendingUp, AlertCircle, Clock } from "lucide-react";

export const NotionStyleDemo = () => {
  const stats = [
    {
      title: "Personal Presencial",
      value: "28",
      description: "Empleados trabajando actualmente",
      trend: { value: 5, label: "vs. semana anterior" }
    },
    {
      title: "Personal Librando",
      value: "12",
      description: "Empleados en días libres",
      trend: { value: -2, label: "vs. semana anterior" }
    },
    {
      title: "Ocupación Hotel",
      value: "85%",
      description: "Porcentaje de ocupación actual",
      trend: { value: 8, label: "vs. ayer" }
    },
    {
      title: "Cumplimiento",
      value: "98%",
      description: "Normativa laboral española",
      trend: { value: 2, label: "este mes" }
    }
  ];

  const recentActivity = [
    {
      title: "Cuadrante Enero 2024",
      description: "Actualizado por Juan Pérez hace 2 horas",
      meta: "2h",
      avatar: <Avatar className="h-8 w-8"><AvatarFallback>JP</AvatarFallback></Avatar>
    },
    {
      title: "Planificación Semana 48",
      description: "Nueva planificación creada",
      meta: "4h",
      avatar: <Avatar className="h-8 w-8"><AvatarFallback>MP</AvatarFallback></Avatar>
    },
    {
      title: "Análisis de Cumplimiento",
      description: "Informe generado automáticamente",
      meta: "1d",
      avatar: <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><AlertCircle className="h-4 w-4" /></div>
    }
  ];

  return (
    <ContentContainer maxWidth="wide">
      <PageHeader
        title="TurnoSmart - Gestión de Personal"
        description="Una interfaz minimalista y elegante inspirada en Notion para la gestión eficiente de personal en hostelería."
        action={
          <Button variant="default" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cuadrante
          </Button>
        }
      />

      {/* Stats Overview */}
      <Section title="Resumen de Personal" spacing="normal">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </Section>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Primary Content */}
        <div className="lg:col-span-2 space-y-8">
          
          <Section title="Panel de Control" description="Acceso rápido a las funciones principales del sistema">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <NotionCard hover className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Cuadrantes</h3>
                    <p className="text-sm text-muted-foreground">Gestión de horarios</p>
                  </div>
                </div>
                <TextContent variant="muted">
                  Crea y edita cuadrantes de trabajo siguiendo la normativa laboral española.
                </TextContent>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Ver Cuadrantes
                </Button>
              </NotionCard>

              <NotionCard hover className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Planificación</h3>
                    <p className="text-sm text-muted-foreground">Cálculos automáticos</p>
                  </div>
                </div>
                <TextContent variant="muted">
                  Calcula automáticamente las necesidades de personal según ocupación.
                </TextContent>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Abrir Calculadora
                </Button>
              </NotionCard>

              <NotionCard hover className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Personal</h3>
                    <p className="text-sm text-muted-foreground">Gestión de empleados</p>
                  </div>
                </div>
                <TextContent variant="muted">
                  Administra la información de empleados y sus contratos.
                </TextContent>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Ver Personal
                </Button>
              </NotionCard>

              <NotionCard hover className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Turno Público</h3>
                    <p className="text-sm text-muted-foreground">Vista para empleados</p>
                  </div>
                </div>
                <TextContent variant="muted">
                  Consulta los horarios publicados para todo el equipo.
                </TextContent>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Ver Turnos
                </Button>
              </NotionCard>

            </div>
          </Section>

          {/* Info Panel */}
          <InfoPanel
            type="info"
            title="Normativa Laboral"
            content={
              <div className="space-y-2">
                <p>
                  Este sistema está diseñado para cumplir con la legislación laboral española 
                  y el convenio colectivo de hostelería de Las Palmas.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">40h semanales</Badge>
                  <Badge variant="secondary">2 días libres consecutivos</Badge>
                  <Badge variant="secondary">48 días vacaciones</Badge>
                </div>
              </div>
            }
          />

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          <Section title="Actividad Reciente">
            <NotionCard padding="none">
              <div className="divide-y divide-border/50">
                {recentActivity.map((item, index) => (
                  <ListItem key={index} {...item} />
                ))}
              </div>
            </NotionCard>
          </Section>

          {/* Empty State Example */}
          <Section title="Estados Vacíos">
            <EmptyState
              title="No hay notificaciones"
              description="Cuando tengas nuevas notificaciones del sistema, aparecerán aquí."
              illustration={<WorkIllustration />}
              action={
                <Button variant="outline" size="sm">
                  Configurar Notificaciones
                </Button>
              }
            />
          </Section>

        </div>
      </div>

      {/* Content Focus Section */}
      <Section 
        title="Filosofía de Diseño" 
        description="Cómo aplicamos los principios de Notion en TurnoSmart"
        spacing="loose"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <NotionCard className="text-center space-y-4">
            <WorkIllustration />
            <div>
              <h4 className="font-medium text-foreground mb-2">Minimalismo</h4>
              <TextContent variant="muted">
                Interfaz limpia que elimina distracciones y se centra en el contenido esencial.
              </TextContent>
            </div>
          </NotionCard>

          <NotionCard className="text-center space-y-4">
            <CalendarIllustration />
            <div>
              <h4 className="font-medium text-foreground mb-2">Profesionalismo</h4>
              <TextContent variant="muted">
                Cada detalle pulido para transmitir confianza y calidad en la gestión laboral.
              </TextContent>
            </div>
          </NotionCard>

          <NotionCard className="text-center space-y-4">
            <TeamIllustration />
            <div>
              <h4 className="font-medium text-foreground mb-2">Calidez</h4>
              <TextContent variant="muted">
                Grises cálidos y esquinas redondeadas crean una experiencia acogedora.
              </TextContent>
            </div>
          </NotionCard>

        </div>
      </Section>

    </ContentContainer>
  );
};