import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export const CleanupUsersButton: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCleanupUsers = async () => {
    setIsDeleting(true);
    
    try {
      console.log('Ejecutando limpieza completa de usuarios...');
      
      const { data, error } = await supabase.functions.invoke('cleanup-all-except-owner');
      
      if (error) {
        console.error('Error en función de limpieza:', error);
        toast.error('Error al limpiar usuarios');
        return;
      }
      
      console.log('Resultado de limpieza:', data);
      
      if (data?.success) {
        toast.success(`Limpieza completada: ${data.successCount} usuarios eliminados`);
        
        if (data.errorCount > 0) {
          toast.warning(`${data.errorCount} usuarios no pudieron ser eliminados`);
        }
        
        // Recargar la página después de un momento para reflejar los cambios
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Error en la limpieza de usuarios');
      }
      
    } catch (error: any) {
      console.error('Error ejecutando limpieza:', error);
      toast.error('Error inesperado al limpiar usuarios');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={isDeleting}
          className="gap-2"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {isDeleting ? 'Limpiando...' : 'Limpiar Usuarios (Mantener Owner)'}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuarios excepto owner@turnosmart.app?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Esta acción eliminará todos los usuarios excepto owner@turnosmart.app:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Usuarios de autenticación</li>
              <li>Perfiles de usuario</li>
              <li>Roles y permisos</li>
              <li>Datos relacionados</li>
            </ul>
            <p className="font-semibold text-red-600 mt-3">
              ⚠️ Esta acción NO se puede deshacer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCleanupUsers}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar todo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};