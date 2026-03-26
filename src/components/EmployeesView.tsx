import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Clock,
  Mail,
  Phone,
  Building,
  Calendar
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Datos de ejemplo basados en el Excel proporcionado
const employeesData = [
  {
    id: 1,
    name: "María González",
    category: "Jefa de Bares",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    email: "maria.gonzalez@cantaclaro.com",
    phone: "+34 628 xxx xxx",
    status: "active",
    currentShift: "10:00 - 18:00",
    location: "Bares Principal"
  },
  {
    id: 2,
    name: "Marcos Toledo",
    category: "Segundo Jefe Bares",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    email: "marcos.toledo@cantaclaro.com",
    phone: "+34 629 xxx xxx",
    status: "active",
    currentShift: "16:30 - 00:30",
    location: "Bares Terraza"
  },
  {
    id: 3,
    name: "Geiler Cruz",
    category: "Camarero",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    email: "geiler.cruz@cantaclaro.com",
    phone: "+34 630 xxx xxx",
    status: "active",
    currentShift: "12:00 - 18:00",
    location: "Bares Piscina"
  },
  {
    id: 4,
    name: "Rosaura Bordon",
    category: "Ayudante Camarero",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    email: "rosaura.bordon@cantaclaro.com",
    phone: "+34 631 xxx xxx",
    status: "vacation",
    currentShift: "-",
    location: "Bares Lobby"
  },
  {
    id: 5,
    name: "Caroline Gil",
    category: "Ayudante Camarero",
    contract: 4,
    contractUnit: 0.5,
    department: "PROPIO",
    email: "caroline.gil@cantaclaro.com",
    phone: "+34 632 xxx xxx",
    status: "active",
    currentShift: "09:00 - 13:00",
    location: "Bares Buffet"
  },
  {
    id: 6,
    name: "Minerva Arías",
    category: "Camarero",
    contract: 6,
    contractUnit: 0.75,
    department: "ETT",
    email: "minerva.arias@temporal.com",
    phone: "+34 633 xxx xxx",
    status: "sick",
    currentShift: "-",
    location: "Bares Principal"
  },
];

export function EmployeesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredEmployees = employeesData.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || employee.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Activo</Badge>;
      case "vacation":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Vacaciones</Badge>;
      case "sick":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Enfermo</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getContractBadge = (contract: number, unit: number) => {
    const percentage = Math.round(unit * 100);
    return (
      <Badge variant="outline" className="text-xs">
        {contract}h ({percentage}%)
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
          <p className="text-muted-foreground">
            Administra la plantilla del Hotel Cantaclaro - {employeesData.length} empleados registrados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                <SelectItem value="PROPIO">Personal Propio</SelectItem>
                <SelectItem value="ETT">ETT</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="vacation">Vacaciones</SelectItem>
                <SelectItem value="sick">Enfermo</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <CardDescription className="text-sm">{employee.category}</CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                    <DropdownMenuItem>Editar información</DropdownMenuItem>
                    <DropdownMenuItem>Asignar turno</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Ver historial</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {getStatusBadge(employee.status)}
                {getContractBadge(employee.contract, employee.contractUnit)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{employee.department}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{employee.currentShift}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{employee.location}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Contactar
                </Button>
                <Button size="sm" className="flex-1">
                  Ver Turnos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron empleados</h3>
            <p className="text-muted-foreground mb-4">
              Ajusta los filtros de búsqueda o agrega nuevos empleados al sistema
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empleado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}