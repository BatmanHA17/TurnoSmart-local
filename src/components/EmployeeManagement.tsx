import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const contractTypes = [
  { value: "indefinido", label: "Contrato Indefinido" },
  { value: "temporal", label: "Contrato Temporal" },
  { value: "formacion_alternancia", label: "Contrato de Formación en Alternancia" },
  { value: "practica_profesional", label: "Contrato Formativo para la obtención de la Práctica Profesional" }
];

const contractHours = [
  { value: "8", label: "8 horas (100%)" },
  { value: "7", label: "7 horas (87.5%)" },
  { value: "6", label: "6 horas (75%)" },
  { value: "5", label: "5 horas (62.5%)" },
  { value: "4", label: "4 horas (50%)" },
  { value: "3", label: "3 horas (37.5%)" },
  { value: "2", label: "2 horas (25%)" },
  { value: "1", label: "1 hora (12.5%)" }
];

const departments = [
  { value: "bares", label: "Bares" },
  { value: "restaurante", label: "Restaurante" },
  { value: "recepcion", label: "Recepción" },
  { value: "limpieza", label: "Limpieza" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "administracion", label: "Administración" }
];

const employeeFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  position: z.string().min(2, "El puesto debe tener al menos 2 caracteres"),
  department: z.string().min(1, "Debe seleccionar un departamento"),
  contractType: z.string().min(1, "Debe seleccionar un tipo de contrato"),
  contractHours: z.string().min(1, "Debe seleccionar las horas de contrato"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  preferredContact: z.enum(["email", "phone"]).optional()
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface Employee extends EmployeeFormData {
  id: string;
}

// Pre-loaded employees from Enero cuadrante
const initialEmployees: Employee[] = [
  // Personal Propio - 8 Horas
  { id: "1", name: "ANTONIO", lastName: "RAHIM", position: "JEFE BARES", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "2", name: "JOSE", lastName: "GARCIA", position: "2º JEFE BARES", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "3", name: "MARCOS", lastName: "TOLEDO", position: "JEFE DE SECTOR", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "4", name: "ANDRES", lastName: "PEREZ", position: "JEFE DE SECTOR", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "5", name: "CARMEN", lastName: "MARTINEZ", position: "CAMARERO/A", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "6", name: "MIGUEL", lastName: "LOPEZ", position: "CAMARERO/A", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "7", name: "ANA", lastName: "RODRIGUEZ", position: "CAMARERO/A", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "8", name: "MINERVA", lastName: "ARIAS", position: "CAMARERO/A", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "9", name: "ROGELIO", lastName: "PEREZ", position: "CAMARERO/A", department: "bares", contractType: "indefinido", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  
  // Personal Propio - 6 Horas
  { id: "10", name: "GEILER", lastName: "CRUZ", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "6", email: "", phone: "", preferredContact: "email" },
  { id: "11", name: "LUCIA", lastName: "SANCHEZ", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "6", email: "", phone: "", preferredContact: "email" },
  
  // Personal Propio - 5 Horas
  { id: "12", name: "ROSAURA", lastName: "BORDON", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "5", email: "", phone: "", preferredContact: "email" },
  { id: "13", name: "PABLO", lastName: "FERNANDEZ", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "5", email: "", phone: "", preferredContact: "email" },
  
  // Personal Propio - 4 Horas
  { id: "14", name: "CAROLINE", lastName: "GIL", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "4", email: "", phone: "", preferredContact: "email" },
  { id: "15", name: "DAVID", lastName: "MORALES", position: "AYUDANTE", department: "bares", contractType: "indefinido", contractHours: "4", email: "", phone: "", preferredContact: "email" },
  
  // Personal ETT
  { id: "101", name: "CARLOS", lastName: "SILVA", position: "CAMARERO/A", department: "bares", contractType: "temporal", contractHours: "8", email: "", phone: "", preferredContact: "email" },
  { id: "102", name: "MARIA", lastName: "VEGA", position: "AYUDANTE", department: "bares", contractType: "temporal", contractHours: "6", email: "", phone: "", preferredContact: "email" },
  { id: "103", name: "FRANCISCO", lastName: "RUIZ", position: "AYUDANTE", department: "bares", contractType: "temporal", contractHours: "4", email: "", phone: "", preferredContact: "email" }
];

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      lastName: "",
      position: "",
      department: "",
      contractType: "",
      contractHours: "",
      email: "",
      phone: "",
      preferredContact: "email"
    }
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      // Editar empleado existente
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id ? { ...data, id: editingEmployee.id } : emp
      ));
      toast.success("Empleado actualizado exitosamente");
    } else {
      // Agregar nuevo empleado
      const newEmployee: Employee = {
        ...data,
        id: Date.now().toString()
      };
      setEmployees(prev => [...prev, newEmployee]);
      toast.success("Empleado agregado exitosamente");
    }
    
    setIsDialogOpen(false);
    setEditingEmployee(null);
    form.reset();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    toast.success("Empleado eliminado exitosamente");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Personas
            </CardTitle>
            <CardDescription>
              Gestiona todo tu equipo desde aquí
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar nuevo empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Editar empleado" : "Agregar nuevo empleado"}</DialogTitle>
                <DialogDescription>
                  {editingEmployee ? "Modifica la información del empleado" : "Completa la información del nuevo empleado"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Datos Personales */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Datos Personales</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del empleado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos *</FormLabel>
                          <FormControl>
                            <Input placeholder="Apellidos del empleado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Información Laboral */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Información Laboral</h3>
                    
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puesto/Rol *</FormLabel>
                          <FormControl>
                            <Input placeholder="Puesto del empleado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar departamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.value} value={dept.value}>
                                  {dept.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contractTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horas de Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar horas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contractHours.map((hours) => (
                                <SelectItem key={hours.value} value={hours.value}>
                                  {hours.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Información de Contacto</h3>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de teléfono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medio preferido de contacto</FormLabel>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="email-contact"
                                checked={field.value === "email"}
                                onCheckedChange={(checked) => checked && field.onChange("email")}
                              />
                              <label htmlFor="email-contact" className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                Email
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="phone-contact"
                                checked={field.value === "phone"}
                                onCheckedChange={(checked) => checked && field.onChange("phone")}
                              />
                              <label htmlFor="phone-contact" className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                Teléfono
                              </label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay empleados registrados</p>
              <p className="text-sm">Comienza agregando tu primer empleado</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <Card key={employee.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{employee.name} {employee.lastName}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(employee)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(employee.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <p className="text-sm">{departments.find(d => d.value === employee.department)?.label}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-secondary px-2 py-1 rounded">
                          {contractHours.find(h => h.value === employee.contractHours)?.label}
                        </span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                          {contractTypes.find(t => t.value === employee.contractType)?.label}
                        </span>
                      </div>
                      {employee.email && (
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};