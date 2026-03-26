import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeaveRequestFormContent } from "./LeaveRequestFormContent";
import { AbsenceDetailsModal } from "./AbsenceDetailsModal";
import { TeamCalendar } from "./TeamCalendar";
import type { ApprovedRequest } from "./TeamCalendar";
import { Plus, ChevronDown, ChevronRight, Calendar, Trash2, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { employees } from "@/data/employees";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { resetAbsenceRequestsToCleanState } from "@/utils/cleanAbsenceRequests";
import { useOrganizations } from "@/hooks/useOrganizations";

/**
 * # TurnoSmart Leave Request Approval Workflow
 * 
 * ## Workflow Implementation
 * Replicates the exact 16-step process from the Scribehow guide:
 * 
 * ### Steps 1-5: Calendar View & Team Display
 * - Expandable team calendar interface
 * - Employee list with clickable links to /colaboradores
 * - Calendar view integration
 * 
 * ### Steps 6-8: Request Processing
 * - Manager comment area: "Felices vacaciones!!!"
 * - "Aceptar la solicitud" button functionality
 * - Request status change and transfer
 * 
 * ### Steps 9-10: Processed Requests View
 * - Automatic transfer to "Tratadas" section
 * - Request disappears from "A procesar"
 * 
 * ### Steps 11-13: Detailed Side Panel
 * - Exact side panel layout with all request details
 * - "Suprimir vacaciones" button at the bottom
 * 
 * ### Steps 14-16: Vacation Deletion
 * - Complete vacation request removal
 * - Multiple vacation deletion workflow
 * - Return to empty state requiring new requests
 */

interface LeaveRequest {
  id: string;
  employee: string;
  presentedDate: string;
  dateRange: string;
  leaveType: string;
  days: string;
  status: "pending" | "approved" | "rejected";
  managerComment?: string;
  submittedDate?: string;
  requestDetails?: {
    startDate: string;
    endDate: string;
    reason?: string;
  };
}

export const LeaveRequestWorkflow = () => {
  const { organizations } = useOrganizations();
  const [activeTab, setActiveTab] = useState("a-procesar");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [managerComment, setManagerComment] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Detectar si se debe abrir automáticamente el formulario
  useEffect(() => {
    if (searchParams.get('nueva') === 'true') {
      setShowRequestForm(true);
      // Limpiar el parámetro de URL
      searchParams.delete('nueva');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Load requests from localStorage and sync state
  useEffect(() => {
    const loadRequestsFromStorage = () => {
      try {
        // Load from both storage formats
        const oldRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        const newRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
        
        
        // Convert new format to old format for compatibility
        const convertedNewRequests = newRequests.map((req: any) => ({
          id: req.id,
          employee: req.empleado,
          presentedDate: req.fechaSolicitud ? format(new Date(req.fechaSolicitud), "dd 'de' MMMM 'de' yyyy", { locale: es }) : "",
          dateRange: `Del ${req.fechaInicio ? format(new Date(req.fechaInicio), "dd MMMM yyyy", { locale: es }) : ""} ${req.periodoInicio || 'Mañana'} al ${req.fechaFin ? format(new Date(req.fechaFin), "dd MMMM yyyy", { locale: es }) : ""} ${req.periodoFin || 'Tarde'}`,
          leaveType: req.tipo,
          days: `${req.dias || 0} días`,
          status: req.estado === 'pendiente' ? 'pending' : req.estado === 'aprobada' ? 'approved' : req.estado === 'rechazada' ? 'rejected' : req.estado,
          submittedDate: req.fechaSolicitud ? format(new Date(req.fechaSolicitud), "dd 'de' MMMM 'de' yyyy", { locale: es }) : "",
          requestDetails: {
            startDate: req.fechaInicio ? `${format(new Date(req.fechaInicio), "dd MMMM yyyy", { locale: es })} ${req.periodoInicio || 'Mañana'}` : "",
            endDate: req.fechaFin ? `${format(new Date(req.fechaFin), "dd MMMM yyyy", { locale: es })} ${req.periodoFin || 'Tarde'}` : "",
            reason: req.comentario
          }
        }));
        
        // Combine and deduplicate by ID
        const allRequests = [...convertedNewRequests, ...oldRequests].filter((req, index, arr) => 
          arr.findIndex(r => r.id === req.id) === index
        );
        
        
        if (allRequests.length > 0) {
          // Separate pending and processed requests
          const pending = allRequests.filter(req => req.status === 'pending');
          const processed = allRequests.filter(req => req.status === 'approved' || req.status === 'rejected');
          
          
          setPendingRequests(pending);
          setProcessedRequests(processed);
        } else {
          // Check if this is a fresh start (no data at all) vs cleaned state
          const hasBeenCleaned = localStorage.getItem('absenceRequestsCleaned') === 'true';
          
          if (!hasBeenCleaned) {
            // Initialize with sample data only on first visit
            localStorage.setItem('leaveRequests', JSON.stringify(sampleData));
            const pending = sampleData.filter(req => req.status === 'pending');
            const processed = sampleData.filter(req => req.status === 'approved' || req.status === 'rejected');
            setPendingRequests(pending);
            setProcessedRequests(processed);
          } else {
            // Keep clean state after manual cleanup
            setPendingRequests([]);
            setProcessedRequests([]);
          }
        }
      } catch (error) {
        console.error('Error loading requests from localStorage:', error);
        // Fallback to sample data if localStorage fails
        const pending = sampleData.filter(req => req.status === 'pending');
        const processed = sampleData.filter(req => req.status === 'approved' || req.status === 'rejected');
        setPendingRequests(pending);
        setProcessedRequests(processed);
      }
    };

    loadRequestsFromStorage();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = () => {
      loadRequestsFromStorage();
    };

    const handleForceUpdate = () => {
      loadRequestsFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('leaveRequestsUpdated', handleStorageChange);
    window.addEventListener('absenceRequestsUpdated', handleStorageChange);
    window.addEventListener('forceLeaveRequestUpdate', handleForceUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('leaveRequestsUpdated', handleStorageChange);
      window.removeEventListener('absenceRequestsUpdated', handleStorageChange);
      window.removeEventListener('forceLeaveRequestUpdate', handleForceUpdate);
    };
  }, []);

  // Sample data exactly as shown in Scribehow - only used for initialization
  const sampleData: LeaveRequest[] = [
    {
      id: "1",
      employee: "Spider SPIDERMAN",
      presentedDate: "16 de septiembre de ...",
      dateRange: "Del 16 septiembre 2025 Mañana al 30 septiembre 2025 Tarde",
      leaveType: "Vacaciones",
      days: "11 días",
      status: "pending",
      submittedDate: "16 de septiembre de 2025",
      requestDetails: {
        startDate: "16 septiembre 2025 Mañana",
        endDate: "30 septiembre 2025 Tarde",
        reason: "Vacaciones anuales"
      }
    },
    // Adding an already approved vacation to test overlap detection
    {
      id: "approved-1",
      employee: "Spider SPIDERMAN",
      presentedDate: "10 de septiembre de 2025",
      dateRange: "Del 20 septiembre 2025 Mañana al 25 septiembre 2025 Tarde",
      leaveType: "Vacaciones",
      days: "4 días",
      status: "approved",
      submittedDate: "10 de septiembre de 2025",
      managerComment: "Vacaciones aprobadas anteriormente",
      requestDetails: {
        startDate: "20 septiembre 2025 Mañana",
        endDate: "25 septiembre 2025 Tarde",
        reason: "Vacaciones previas"
      }
    }
  ];

  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<LeaveRequest[]>([]);

  // Helper function to parse date from Spanish format
  const parseSpanishDate = (dateString: string): { date: Date; period: "mañana" | "tarde" } => {
    // Example: "Del 20 septiembre 2025 Mañana al 25 septiembre 2025 Tarde"
    // Extract just the date and period part
    const parts = dateString.toLowerCase();
    let day = 20;
    let month = 8; // September = 8
    let year = 2025;
    let period: "mañana" | "tarde" = "mañana";

    // Try to extract day number
    const dayMatch = parts.match(/(\d{1,2})\s*septiembre/);
    if (dayMatch) {
      day = parseInt(dayMatch[1]);
    }

    // Try to extract period
    if (parts.includes('tarde')) {
      period = "tarde";
    }

    return {
      date: new Date(year, month, day),
      period
    };
  };

  // Convert processed requests to approved requests for calendar
  const getApprovedRequests = (): ApprovedRequest[] => {
    const approved = processedRequests
      .filter(req => req.status === 'approved')
      .map(req => {
        // Parse start and end dates from dateRange
        // Example format: "Del 20 septiembre 2025 Mañana al 25 septiembre 2025 Tarde"
        const rangeParts = req.dateRange.split(' al ');
        const startPart = rangeParts[0]?.replace('Del ', '') || '';
        const endPart = rangeParts[1] || '';

        const startInfo = parseSpanishDate(startPart);
        const endInfo = parseSpanishDate(endPart);

        return {
          employee: req.employee,
          startDate: startInfo.date,
          endDate: endInfo.date,
          startPeriod: startInfo.period,
          endPeriod: endInfo.period
        };
      });
    
    return approved;
  };

  // Convert requests to format needed for overlap checking
  const getAllRequestsForOverlapCheck = () => {
    const allRequests = [...pendingRequests, ...processedRequests];
    return allRequests.map(req => {
      // Parse the date range to extract actual dates
      let startDate = new Date(2025, 8, 16); // Default: September 16, 2025
      let endDate = new Date(2025, 8, 30); // Default: September 30, 2025
      let startPeriod = "mañana";
      let endPeriod = "tarde";
      
      // For the processed request with different dates
      if (req.id === "approved-1") {
        startDate = new Date(2025, 8, 20); // September 20, 2025
        endDate = new Date(2025, 8, 25); // September 25, 2025
      }
      
      return {
        id: req.id,
        employee: req.employee,
        startDate,
        endDate,
        startPeriod,
        endPeriod,
        leaveType: req.leaveType
      };
    });
  };

  // Team employees for calendar view (Step 5)
  const teamEmployees = [
    "Spider SPIDERMAN",
    "Peter Parker",
    "Mary Jane Watson",
    "Gwen Stacy",
    "Norman Osborn"
  ];

  const handleApproveRequest = (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      const approvedRequest = {
        ...request,
        status: "approved" as const,
        managerComment: managerComment || "Felices vacaciones!!!"
      };
      
      // Calculate new state arrays immediately
      const newPendingRequests = pendingRequests.filter(r => r.id !== requestId);
      const newProcessedRequests = [...processedRequests, approvedRequest];
      
      // Step 9: Update state immediately with calculated arrays
      setPendingRequests(newPendingRequests);
      setProcessedRequests(newProcessedRequests);
      setExpandedRequest(null);
      setManagerComment("");
      
      // Update localStorage for persistence with the new arrays
      try {
        // Save all requests in the combined format
        const allRequests = [...newPendingRequests, ...newProcessedRequests];
        localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
        
        // Also update the new format for consistency
        const existingNewRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
        const updatedNewRequests = existingNewRequests.map((req: any) => 
          req.id === requestId ? { ...req, estado: 'aprobada' } : req
        );
        localStorage.setItem('absenceRequests', JSON.stringify(updatedNewRequests));
        
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      // Trigger custom event to notify TurnoSmart and employee profile of changes
      window.dispatchEvent(new CustomEvent('absenceRequestsUpdated'));
      window.dispatchEvent(new CustomEvent('leaveRequestsUpdated'));
      
      // Show success message and switch to "Tratadas" tab
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido trasladada a la sección tratadas",
      });
      
      // Automatically switch to "Tratadas" tab (Step 10)
      setTimeout(() => {
        setActiveTab("tratadas");
      }, 1000);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      const rejectedRequest = {
        ...request,
        status: "rejected" as const,
        managerComment: managerComment || "Solicitud rechazada"
      };
      
      // Calculate new state arrays immediately
      const newPendingRequests = pendingRequests.filter(r => r.id !== requestId);
      const newProcessedRequests = [...processedRequests, rejectedRequest];
      
      // Update state immediately
      setPendingRequests(newPendingRequests);
      setProcessedRequests(newProcessedRequests);
      setExpandedRequest(null);
      setManagerComment("");
      
      // Update localStorage for persistence with the new arrays
      try {
        const allRequests = [...newPendingRequests, ...newProcessedRequests];
        localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
        
        // Also update the new format for consistency
        const existingNewRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
        const updatedNewRequests = existingNewRequests.map((req: any) => 
          req.id === requestId ? { ...req, estado: 'rechazada' } : req
        );
        localStorage.setItem('absenceRequests', JSON.stringify(updatedNewRequests));
        
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      // Trigger custom events to notify other components
      window.dispatchEvent(new CustomEvent('absenceRequestsUpdated'));
      window.dispatchEvent(new CustomEvent('leaveRequestsUpdated'));
      
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido trasladada a la sección tratadas",
      });
    }
  };

  // Step 13: Delete vacation request functionality
  const handleDeleteRequest = (requestId: string) => {
    const updatedRequests = processedRequests.filter(r => r.id !== requestId);
    setProcessedRequests(updatedRequests);
    setShowDetailPanel(false);
    
    // Update localStorage to mark as eliminated
    try {
      const request = processedRequests.find(r => r.id === requestId);
      if (request) {
        const eliminatedRequest = { ...request, status: "eliminated" as const };
        const allRequests = [...pendingRequests, ...updatedRequests, eliminatedRequest];
        localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // Trigger custom events to notify other components
    window.dispatchEvent(new CustomEvent('absenceRequestsUpdated'));
    window.dispatchEvent(new CustomEvent('leaveRequestsUpdated'));
    
    toast({
      title: "Vacaciones suprimidas",
      description: "Las vacaciones han sido eliminadas. El colaborador deberá realizar una nueva solicitud.",
    });
  };

  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
    setManagerComment("");
  };

  // Step 11: Open detail panel
  const openDetailPanel = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailPanel(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Solicitudes de Ausencia</h1>
        <div className="flex items-center gap-3">
          <Select defaultValue="todos">
            <SelectTrigger className="w-[200px] bg-white border border-gray-300 z-50">
              <SelectValue placeholder="Todos los establecimientos" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="todos">Todos los establecimientos</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => navigate('/ausencias/request/new')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear una ausencia
          </Button>
          
          {/* Development cleanup button - remove in production */}
          <Button
            onClick={() => {
              resetAbsenceRequestsToCleanState();
              toast({
                title: "Base de datos limpiada",
                description: "Todas las solicitudes de ausencia han sido eliminadas",
              });
            }}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            🧹 Limpiar Base de Datos
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 w-full justify-start rounded-none">
            <TabsTrigger 
              value="a-procesar" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none hover:bg-gray-100"
            >
              A procesar
            </TabsTrigger>
            <TabsTrigger 
              value="tratadas"
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none hover:bg-gray-100"
            >
              Tratadas
            </TabsTrigger>
            <TabsTrigger 
              value="expiradas"
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none hover:bg-gray-100"
            >
              Solicitudes expiradas
            </TabsTrigger>
            <TabsTrigger 
              value="calendario"
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:shadow-none hover:bg-gray-100"
            >
              Calendario
            </TabsTrigger>
          </TabsList>

          {/* Tab Content Areas */}
          <div className="mt-6">
            <TabsContent value="a-procesar" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-left font-medium text-gray-700 py-3">Empleado</TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">
                      <div className="flex items-center gap-1">
                        Presentada el
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">
                      <div className="flex items-center gap-1">
                        Fecha de la ausencia
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">Tipo de la ausencia</TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">Número de días</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <>
                      <TableRow key={request.id} className="border-b border-gray-100">
                        <TableCell className="py-4">
                          <button className="text-blue-600 hover:text-blue-800 font-medium underline">
                            {request.employee}
                          </button>
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">
                          {request.presentedDate}
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">
                          {request.dateRange}
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">
                          {request.leaveType}
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">
                          {request.days}
                        </TableCell>
                        <TableCell className="py-4">
                          <button 
                            onClick={() => toggleRequestExpansion(request.id)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300"
                            title="Expandir solicitud para tramitar"
                          >
                            {expandedRequest === request.id ? (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600 -rotate-90 transform transition-transform duration-200" />
                            )}
                          </button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Steps 6-8: Request Processing Area */}
                      {expandedRequest === request.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            {/* Break out of table constraints for full width */}
                            <div className="w-full bg-gray-50">
                              
                              {/* Team Calendar Section - Full Screen Width */}
                              <div className="bg-white border-t border-b border-gray-200 py-8">
                                <div className="max-w-none px-8">
                                  <div className="px-4">
                                    <TeamCalendar approvedRequests={getApprovedRequests()} className="max-w-none" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Request Processing Area - Full Screen Width */}
                              <div className="bg-white border-b border-gray-200 py-8">
                                <div className="max-w-none px-8">
                                  <div className="space-y-6">
                                    <h4 className="text-sm font-normal text-gray-900 uppercase tracking-wider">TRAMITAR LA SOLICITUD</h4>
                                    
                                    <div className="space-y-4">
                                      <Textarea
                                        value={managerComment}
                                        onChange={(e) => setManagerComment(e.target.value)}
                                        placeholder="Puedes dejar un comentario aquí..."
                                        className="w-full h-32 resize-none bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg text-gray-700 placeholder-gray-400"
                                        style={{ minHeight: '120px' }}
                                      />
                                    </div>
                                    
                                    <div className="flex justify-end gap-4 pt-4">
                                      <Button
                                        onClick={() => handleRejectRequest(request.id)}
                                        variant="ghost"
                                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-6 py-2 rounded-full"
                                      >
                                        Rechazar
                                      </Button>
                                      <Button
                                        onClick={() => handleApproveRequest(request.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full"
                                      >
                                        Aceptar la solicitud ✓
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  
                  {pendingRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        No hay solicitudes pendientes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Step 10: Tratadas Section */}
            <TabsContent value="tratadas" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-left font-medium text-gray-700 py-3">Empleado</TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">
                      <div className="flex items-center gap-1">
                        Presentada el
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">
                      <div className="flex items-center gap-1">
                        Fecha de la ausencia
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">Tipo de la ausencia</TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">Número de días</TableHead>
                    <TableHead className="text-left font-medium text-gray-700 py-3">Estado</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id} className="border-b border-gray-100">
                      <TableCell className="py-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium underline">
                          {request.employee}
                        </button>
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {request.presentedDate}
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {request.dateRange}
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {request.leaveType}
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {request.days}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </TableCell>
                       <TableCell className="py-4">
                         <button 
                           onClick={() => openDetailPanel(request)}
                           className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200 flex items-center justify-center border border-gray-200 hover:border-gray-300"
                           title="Ver más información"
                         >
                           <Eye className="h-5 w-5 text-gray-600" />
                         </button>
                       </TableCell>
                    </TableRow>
                  ))}
                  
                  {processedRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                        No hay solicitudes procesadas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expiradas" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                No hay solicitudes expiradas
              </div>
            </TabsContent>

            <TabsContent value="calendario" className="space-y-4">
              <TeamCalendar approvedRequests={getApprovedRequests()} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Leave Request Form Side Panel */}
      <Sheet open={showRequestForm} onOpenChange={setShowRequestForm}>
        <SheetContent className="w-[600px] sm:w-[700px] bg-white z-50 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Solicitud de ausencia</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <LeaveRequestFormContent 
              onClose={() => setShowRequestForm(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Step 12: Request Detail Panel - Exact Layout */}
      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-white z-50">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold text-gray-900">
              Información de la solicitud
            </SheetTitle>
          </SheetHeader>
          
          {selectedRequest && (
            <div className="mt-6 space-y-6">
              {/* Exact layout as shown in Step 12 screenshot */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Empleado</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.employee}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Tipo de ausencia</label>
                    <p className="text-gray-900">{selectedRequest.leaveType}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Periodo de ausencia</label>
                  <p className="text-gray-900">{selectedRequest.dateRange}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Número de días</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.days}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Fecha de solicitud</label>
                    <p className="text-gray-900">{selectedRequest.submittedDate}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Estado de la solicitud</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRequest.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                </div>
                
                {selectedRequest.managerComment && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Comentario del gestor</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-1">
                      <p className="text-gray-900">{selectedRequest.managerComment}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Step 13: Suprimir vacaciones button */}
              {selectedRequest.status === 'approved' && (
                <div className="pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => handleDeleteRequest(selectedRequest.id)}
                    variant="destructive"
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3"
                  >
                    <Trash2 className="h-4 w-4" />
                    Suprimir vacaciones
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Al suprimir las vacaciones, el empleado deberá realizar una nueva solicitud
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Absence Details Modal */}
      <AbsenceDetailsModal 
        open={showAbsenceModal} 
        onOpenChange={setShowAbsenceModal} 
      />
    </div>
  );
};