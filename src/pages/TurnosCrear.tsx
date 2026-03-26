import { GoogleCalendarStyle } from "@/components/GoogleCalendarStyle";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import type { ApprovedRequest } from "@/components/TeamCalendar";

export default function TurnosCrear() {
  const navigate = useNavigate();
  const { role } = useUserRoleCanonical();
  const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);

  useEffect(() => {
    document.title = "TurnoSmart – Gestión de Horarios";
    
    // Load approved requests from localStorage (shared with LeaveRequestWorkflow)
    const loadApprovedRequests = () => {
      try {
        const storedProcessedRequests = localStorage.getItem('processed-leave-requests');
        if (storedProcessedRequests) {
          const processedRequests = JSON.parse(storedProcessedRequests);
          const approved = processedRequests
            .filter((req: any) => req.status === 'approved')
            .map((req: any) => ({
              employee: req.employeeName,
              startDate: new Date(req.startDate),
              endDate: new Date(req.endDate),
              startPeriod: req.startPeriod,
              endPeriod: req.endPeriod
            }));
          setApprovedRequests(approved);
        }
      } catch (error) {
        console.error('Error loading approved requests:', error);
      }
    };
    
    loadApprovedRequests();
    
    // Listen for storage changes to sync with LeaveRequestWorkflow
    const handleStorageChange = () => {
      loadApprovedRequests();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events within the same tab
    window.addEventListener('absenceRequestsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('absenceRequestsUpdated', handleStorageChange);
    };
  }, []);

  return <GoogleCalendarStyle approvedRequests={approvedRequests} />;
}
