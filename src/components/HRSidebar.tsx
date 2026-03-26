import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, FileText, Users, User, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function HRSidebar() {
  const [seguimientoExpanded, setSeguimientoExpanded] = useState(true);
  const [auditExpanded, setAuditExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 bg-background border-r border-border/40 p-4">
      <div className="space-y-2">
        {/* Resumen */}
        <div 
          className={`flex items-center gap-2 p-2 rounded-md font-medium cursor-pointer ${location.pathname === "/hr/home" ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}
          onClick={() => navigate("/hr/home")}
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </div>

        {/* Seguimiento colaborador */}
        <Collapsible open={seguimientoExpanded} onOpenChange={setSeguimientoExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Seguimiento colaborador</span>
              </div>
              {seguimientoExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-6 space-y-1">
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/onboarding" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/onboarding")}
              >
                <span className="text-xs">Entradas</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/exits" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/exits")}
              >
                <span className="text-xs">Salidas</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/fin-periodo-prueba" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/fin-periodo-prueba")}
              >
                <span className="text-xs">Fin del período de prueba</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/incomplete-profiles" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/incomplete-profiles")}
              >
                <span className="text-xs">Perfiles incompletos</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/vacation-counter" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/vacation-counter")}
              >
                <span className="text-xs">Contador de vacaciones</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/absence-log" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/absence-log")}
              >
                <span className="text-xs">Registro de ausencias</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/work-permits" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/work-permits")}
              >
                <span className="text-xs">Permisos de trabajo</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/contract-modifications" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/contract-modifications")}
              >
                <span className="text-xs">Modificación de contratos</span>
              </div>
              <div 
                className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/clock-in-tracking" ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => navigate("/hr/clock-in-tracking")}
              >
                <span className="text-xs">Seguimiento de fichajes</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Documentos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Documentos</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="ml-6 space-y-1">
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/document-signing" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/document-signing")}
            >
              <span className="text-xs text-muted-foreground">Firma de documentos</span>
            </div>
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/payroll-distribution" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/payroll-distribution")}
            >
              <span className="text-xs text-muted-foreground">Distribución de nóminas</span>
            </div>
          </div>
        </div>

        {/* Análisis de RRHH */}
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Análisis de RRHH</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="ml-6 space-y-1">
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/overview" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/overview")}
            >
              <span className="text-xs">Visión general</span>
            </div>
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/team" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/team")}
            >
              <span className="text-xs">Plantilla</span>
            </div>
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/hours-worked" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/hours-worked")}
            >
              <span className="text-xs">Horas trabajadas</span>
            </div>
            <div 
              className={`p-2 hover:bg-muted/50 rounded-md cursor-pointer ${location.pathname === "/hr/absences" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => navigate("/hr/absences")}
            >
              <span className="text-xs">Ausencias</span>
            </div>
          </div>
        </div>

        {/* Auditoría de Turnos */}
        <div 
          className={`flex items-center gap-2 p-2 rounded-md font-medium cursor-pointer ${location.pathname === "/hr/audit-policies" ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}
          onClick={() => navigate("/hr/audit-policies")}
        >
          <Shield className="w-4 h-4" />
          <span className="text-sm">Auditoría de Turnos</span>
        </div>
      </div>
    </div>
  );
}