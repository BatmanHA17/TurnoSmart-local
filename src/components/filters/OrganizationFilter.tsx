import * as React from "react";
import { Filter, ChevronDown, Search, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import type { OrganizationFilterProps, OrganizationFilterState } from "@/types/organization";
import { esStrings } from "@/i18n/es";

// Componente unificado para filtros de organización/establecimiento
export function OrganizationFilter({ 
  value, 
  onChange, 
  className,
  placeholder = esStrings.todosLosEstablecimientos,
  showSearch = false,
  showTeams = false,
  variant = 'popover'
}: OrganizationFilterProps) {
  const { organizations, loading } = useOrganizationsUnified();
  const [state, setState] = React.useState<OrganizationFilterState>({
    selectedOrganization: value,
    searchTerm: "",
    isOpen: false
  });

  React.useEffect(() => {
    setState(prev => ({ ...prev, selectedOrganization: value }));
  }, [value]);

  const options = React.useMemo(() => {
    const baseOptions = [
      { id: "all", name: placeholder, type: "all" as const }
    ];

    const orgOptions = organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: "establishment" as const
    }));

    return [...baseOptions, ...orgOptions];
  }, [organizations, placeholder]);

  const selectedOption = options.find(opt => opt.id === value) || options[0];

  const handleSelect = (id: string) => {
    onChange(id);
    setState(prev => ({ 
      ...prev, 
      selectedOrganization: id, 
      isOpen: false,
      searchTerm: ""
    }));
  };

  const filteredOptions = React.useMemo(() => {
    if (!state.searchTerm) return options;
    return options.filter(opt => 
      opt.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  }, [options, state.searchTerm]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded" />
      </div>
    );
  }

  // Variant: Select (más simple)
  if (variant === 'select') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {!showSearch && <Filter className="w-4 h-4 text-muted-foreground" />}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[300px] bg-white border border-gray-300 rounded-md px-3 py-2 text-sm">
            {showSearch && (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder={placeholder} />
              </div>
            )}
            {!showSearch && <SelectValue placeholder={placeholder} />}
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Variant: Dropdown (estilo ClockInEstablishmentFilter)
  if (variant === 'dropdown') {
    return (
      <div className={cn("flex items-center", className)}>
        <Popover 
          open={state.isOpen} 
          onOpenChange={(open) => setState(prev => ({ ...prev, isOpen: open }))}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-64 justify-between text-left font-normal px-3 py-2 h-10",
                "border-gray-300 bg-white hover:bg-gray-50",
                "text-gray-700 text-sm"
              )}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  {state.searchTerm || selectedOption.name}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0 shadow-lg border border-gray-200" 
            align="start"
            side="bottom"
            sideOffset={8}
          >
            <div className="bg-white rounded-lg">
              {/* Search input */}
              {showSearch && (
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={placeholder}
                      value={state.searchTerm}
                      onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 border-gray-300 text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Options */}
              <div className="py-2">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-sm text-left",
                      "hover:bg-gray-50 transition-colors duration-150",
                      value === option.id && "bg-blue-50"
                    )}
                    onClick={() => handleSelect(option.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {value === option.id && <Check className="w-3 h-3 text-blue-600" />}
                      </div>
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{option.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Variant: Popover (default, estilo EstablishmentFilter)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Filter className="w-4 h-4 text-muted-foreground" />
      <Popover 
        open={state.isOpen} 
        onOpenChange={(open) => setState(prev => ({ ...prev, isOpen: open }))}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "text-sm text-muted-foreground hover:text-foreground",
              "font-normal justify-start p-0 h-auto gap-1",
              "transition-colors duration-200"
            )}
          >
            <span>{selectedOption.name}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 shadow-lg" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-900">
                Filtrar por establecimiento
              </h4>
            </div>
            
            {/* Search */}
            {showSearch && (
              <div className="px-4 py-2 border-b border-gray-100">
                <Input
                  placeholder="Buscar..."
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="text-sm"
                />
              </div>
            )}
            
            {/* Options */}
            <div className="py-2">
              <div className="px-4 py-2">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Establecimientos
                </h5>
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md",
                      "hover:bg-gray-50 transition-colors duration-150",
                      value === option.id && "bg-gray-100 text-gray-900 font-medium"
                    )}
                    onClick={() => handleSelect(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componentes legacy para compatibilidad
export const EstablishmentFilter = OrganizationFilter;
export const ClockInEstablishmentFilter = (props: OrganizationFilterProps) => (
  <OrganizationFilter {...props} variant="dropdown" showSearch={true} />
);