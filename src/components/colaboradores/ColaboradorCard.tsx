import { useState } from "react";
import { getInitials } from "@/utils/avatar";
import { MoreHorizontal, Mail, Phone, Calendar, User, Edit2, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotionCard } from "@/components/ui/notion-components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";

interface ColaboradorCardProps {
  colaborador: {
    id: number | string;
    name: string;
    lastName: string;
    displayName: string;
    employeeId: string;
    category: string;
    department: string;
    contractType: string;
    contractUnit: number;
    email: string;
    phone: string;
    startDate: string;
    status: string;
    profileImage?: string | null;
  };
}

export const ColaboradorCard = ({ colaborador }: ColaboradorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { assignments, getJobStatus } = useTeamAssignments(colaborador.id.toString());


  const getContractBadgeVariant = (contractType: string) => {
    switch (contractType) {
      case "8 horas":
        return "default";
      case "6 horas":
        return "secondary";
      case "5 horas":
        return "outline";
      case "4 horas":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getDepartmentBadgeVariant = (department: string) => {
    return department === "PROPIO" ? "default" : "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NotionCard hover>
      <div className="space-y-4">
        {/* Header with Avatar and Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={colaborador.profileImage || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(colaborador.name, colaborador.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {colaborador.name} {colaborador.lastName}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {(() => {
                  const jobStatus = getJobStatus();
                  if (jobStatus.type === 'partial' || jobStatus.type === 'incomplete') {
                    return jobStatus.message;
                  }
                  if (assignments.length > 0) {
                    const firstJobAssignment = assignments.find(a => a.has_job);
                    return firstJobAssignment?.job_title || colaborador.category;
                  }
                  return colaborador.category;
                })()}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={getContractBadgeVariant(colaborador.contractType)} className="text-xs">
                  {colaborador.contractType}
                </Badge>
                {assignments.length > 0 ? (
                  assignments.slice(0, 2).map((assignment) => (
                    <Badge 
                      key={assignment.id} 
                      variant={assignment.has_job ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {assignment.department_name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Sin equipo
                  </Badge>
                )}
                {assignments.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{assignments.length - 2} más
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-50'}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar información
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar colaborador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Employee Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">ID: {colaborador.employeeId}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{colaborador.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{colaborador.phone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Inicio: {formatDate(colaborador.startDate)}</span>
          </div>
        </div>

        {/* Footer with Contract Details */}
        <div className="pt-3 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Equivalencia: {colaborador.contractUnit} U</span>
            <Badge 
              variant={colaborador.status === "Activo" ? "default" : "secondary"}
              className="text-xs"
            >
              {colaborador.status}
            </Badge>
          </div>
        </div>
      </div>
      </NotionCard>
    </div>
  );
};