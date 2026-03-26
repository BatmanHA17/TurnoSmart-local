import { Building2, Check, ChevronDown } from "lucide-react";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function OrganizationSwitcher() {
  const { organizations, currentOrg, loading, switchOrganization } = useCurrentOrganization();

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === currentOrg?.org_id) return;

    const success = await switchOrganization(orgId);
    if (success) {
      const newOrg = organizations.find(org => org.org_id === orgId);
      toast({
        title: "Organización cambiada",
        description: `Ahora estás trabajando en ${newOrg?.org_name}`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo cambiar la organización",
        variant: "destructive",
      });
    }
  };

  if (loading || !currentOrg) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Cargando...
      </Button>
    );
  }

  if (organizations.length <= 1) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        {currentOrg.org_name}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Building2 className="h-4 w-4 mr-2" />
          <span className="max-w-32 truncate">{currentOrg.org_name}</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Cambiar organización
        </div>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.org_id}
            onClick={() => handleSwitchOrg(org.org_id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{org.org_name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={org.user_role === 'OWNER' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {org.user_role}
                    </Badge>
                    {org.is_primary && (
                      <Badge variant="outline" className="text-xs">
                        Activa
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {org.is_primary && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}