// Sistema de horarios guardados con persistencia en Supabase - FIXED CACHE ISSUES v2.2
import { supabase } from "@/integrations/supabase/client";
import { Break } from "@/utils/breakCalculations";

export interface SavedShift {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  color: string;
  accessType: 'company' | 'team' | 'absence';
  selectedTeam?: string;
  selectedWorkplace?: string;
  department?: string;
  organization?: string;
  
  breakType?: string;
  breakDuration?: string;
  breaks?: Break[];
  hasBreak?: boolean;
  totalBreakTime?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isSystemDefault?: boolean;
  description?: string;
}

// Cache for shifts to avoid unnecessary database calls
let shiftsCache: SavedShift[] | null = null;

async function read(): Promise<SavedShift[]> {
  try {
    // Obtener la organización actual del usuario
    const { data: userOrgs, error: orgError } = await supabase.rpc('get_user_organizations');
    const currentOrg = userOrgs?.[0];
    
    if (orgError) {
      console.error('Error getting user organizations:', orgError);
    }
    
    const { data, error } = await supabase
      .from('saved_shifts')
      .select('*')
      .eq('org_id', currentOrg?.org_id || '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error reading saved shifts:', error);
      return [];
    }
    
    const shifts = data?.map(shift => ({
      id: shift.id,
      name: shift.name,
      startTime: shift.start_time,
      endTime: shift.end_time,
      color: shift.color,
      accessType: shift.access_type as 'company' | 'team',
      selectedTeam: shift.selected_team,
      selectedWorkplace: shift.selected_workplace,
      department: shift.department,
      organization: shift.organization,
      breakType: shift.break_type,
      breakDuration: shift.break_duration,
      breaks: shift.breaks ? JSON.parse(typeof shift.breaks === 'string' ? shift.breaks : JSON.stringify(shift.breaks)) : [],
      hasBreak: shift.has_break || false,
      totalBreakTime: shift.total_break_time || 0,
      notes: shift.notes,
      createdAt: new Date(shift.created_at),
      updatedAt: new Date(shift.updated_at)
    })) || [];
    
    shiftsCache = shifts;
    return shifts;
  } catch (error) {
    console.error('Error reading saved shifts:', error);
    return [];
  }
}

// Función para limpiar los horarios guardados
export async function clearSavedShifts(): Promise<void> {
  try {
    const { error } = await supabase
      .from('saved_shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except system defaults
    
    if (error) {
      console.error('Error clearing saved shifts:', error);
    } else {
      shiftsCache = null; // Clear cache
    }
  } catch (error) {
    console.error('Error clearing saved shifts:', error);
  }
}

export async function getSavedShifts(forceReload = false): Promise<SavedShift[]> {
  if (shiftsCache && !forceReload) {
    return shiftsCache;
  }
  shiftsCache = null; // Clear cache to force reload
  const shifts = await read();
  return shifts;
}

export function getSavedShiftsSync(): SavedShift[] {
  return shiftsCache || [];
}

export async function addSavedShift(shift: Omit<SavedShift, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedShift | null> {
  try {
    // Obtener la organización actual del usuario
    const { data: userOrgs, error: orgError } = await supabase.rpc('get_user_organizations');
    const currentOrg = userOrgs?.[0]; // Primera organización como predeterminada
    
    if (orgError) {
      console.error('Error getting user organizations:', orgError);
    }
    
    const { data, error } = await supabase
      .from('saved_shifts')
      .insert({
        name: shift.name,
        start_time: shift.startTime || null,
        end_time: shift.endTime || null,
        color: shift.color,
        access_type: shift.accessType,
        selected_team: shift.selectedTeam,
        selected_workplace: shift.selectedWorkplace,
        department: shift.department,
        organization: shift.organization,
        break_type: shift.breakType,
        break_duration: shift.breakDuration,
        breaks: shift.breaks ? JSON.stringify(shift.breaks) : null,
        has_break: shift.hasBreak || (shift.totalBreakTime && shift.totalBreakTime > 0) || (shift.breakDuration && shift.breakDuration !== '0') || false,
        total_break_time: shift.totalBreakTime || 0,
        notes: shift.notes,
        org_id: currentOrg?.org_id || '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding saved shift:', error);
      return null;
    }
    
    const newShift: SavedShift = {
      id: data.id,
      name: data.name,
      startTime: data.start_time,
      endTime: data.end_time,
      color: data.color,
      accessType: data.access_type as 'company' | 'team',
      selectedTeam: data.selected_team,
      selectedWorkplace: data.selected_workplace,
      department: data.department,
      organization: data.organization,
      breakType: data.break_type,
      breakDuration: data.break_duration,
      breaks: data.breaks ? JSON.parse(typeof data.breaks === 'string' ? data.breaks : JSON.stringify(data.breaks)) : [],
      hasBreak: data.has_break || false,
      totalBreakTime: data.total_break_time || 0,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    // Clear cache to force fresh reload on next request
    shiftsCache = null;
    
    // Auto-añadir a favoritos para que aparezca inmediatamente en la UI
    if (typeof window !== 'undefined') {
      try {
        const favoritesKey = 'turnosmart-favorite-shifts';
        const stored = localStorage.getItem(favoritesKey);
        const favorites = stored ? JSON.parse(stored) : [];
        
        // Verificar que no exista ya (por nombre o id)
        const exists = favorites.some((f: any) => f.id === newShift.id || f.name === newShift.name);
        if (!exists) {
          favorites.push(newShift);
          localStorage.setItem(favoritesKey, JSON.stringify(favorites));
        }
      } catch (e) {
        console.warn('No se pudo añadir a favoritos:', e);
      }
      
      // Notificar a componentes sobre el nuevo horario
      window.dispatchEvent(new CustomEvent('shifts-updated'));
    }
    
    return newShift;
  } catch (error) {
    console.error('Error adding saved shift:', error);
    return null;
  }
}

export async function updateSavedShift(id: string, updates: Partial<SavedShift>): Promise<boolean> {
  try {
    // Verificar si el ID es un UUID válido (UUIDs tienen 36 caracteres con guiones)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // Si no es un UUID válido, probablemente es un turno de favoritos de localStorage
      // En este caso, no podemos actualizarlo en la base de datos
      console.warn('Attempted to update a non-database shift (probably from localStorage favorites):', id);
      return false;
    }

    // Primero obtener el nombre anterior del horario para actualizar calendar_shifts
    const { data: currentShift, error: fetchError } = await supabase
      .from('saved_shifts')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current shift:', fetchError);
    }

    const oldShiftName = currentShift?.name;
    
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.accessType !== undefined) updateData.access_type = updates.accessType;
    if (updates.selectedTeam !== undefined) updateData.selected_team = updates.selectedTeam;
    if (updates.selectedWorkplace !== undefined) updateData.selected_workplace = updates.selectedWorkplace;
    if (updates.department !== undefined) updateData.department = updates.department;
    if (updates.organization !== undefined) updateData.organization = updates.organization;
    if (updates.breakType !== undefined) updateData.break_type = updates.breakType;
    if (updates.breakDuration !== undefined) updateData.break_duration = updates.breakDuration;
    if (updates.breaks !== undefined) updateData.breaks = JSON.stringify(updates.breaks);
    if (updates.hasBreak !== undefined) updateData.has_break = updates.hasBreak;
    if (updates.totalBreakTime !== undefined) updateData.total_break_time = updates.totalBreakTime;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    
    // Auto-calcular has_break si no se proporcionó explícitamente
    if (updates.hasBreak === undefined) {
      const hasBreakCalc = (updates.totalBreakTime && updates.totalBreakTime > 0) || 
                          (updates.breakDuration && updates.breakDuration !== '0');
      if (hasBreakCalc) {
        updateData.has_break = true;
      }
    }
    
    const { error } = await supabase
      .from('saved_shifts')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating saved shift:', error);
      return false;
    }

    // Si cambió el nombre, actualizar también los registros de calendar_shifts
    if (updates.name && oldShiftName && updates.name !== oldShiftName) {
      const { error: calendarError } = await supabase
        .from('calendar_shifts')
        .update({ shift_name: updates.name })
        .eq('shift_name', oldShiftName);

      if (calendarError) {
        console.error('Error updating calendar_shifts:', calendarError);
      } else {
      }
    }
    
    // Clear cache to force fresh reload on next request
    shiftsCache = null;
    
    // SYNC: Eliminar/actualizar en localStorage favoritos para evitar duplicados
    syncLocalStorageFavorites(id, oldShiftName, updates.name);
    
    // Notificar a otros componentes sobre la actualización
    localStorage.setItem('saved-shifts-updated', Date.now().toString());
    window.dispatchEvent(new StorageEvent('storage', { 
      key: 'saved-shifts-updated', 
      newValue: Date.now().toString() 
    }));
    
    return true;
  } catch (error) {
    console.error('Error updating saved shift:', error);
    return false;
  }
}

// Función auxiliar para sincronizar localStorage favoritos al editar/eliminar
function syncLocalStorageFavorites(shiftId: string, oldName?: string, newName?: string): void {
  try {
    const stored = localStorage.getItem('turnosmart-favorite-shifts');
    if (!stored) return;
    
    const favoriteShifts = JSON.parse(stored);
    
    // Filtrar por ID y también por nombre antiguo para eliminar duplicados
    const updatedFavorites = favoriteShifts.filter((fav: any) => {
      // Eliminar si coincide el ID
      if (fav.id === shiftId) return false;
      // Eliminar si coincide el nombre antiguo (para evitar duplicado)
      if (oldName && fav.name === oldName) return false;
      // Eliminar si coincide el nombre nuevo (para evitar duplicado)
      if (newName && fav.name === newName) return false;
      return true;
    });
    
    localStorage.setItem('turnosmart-favorite-shifts', JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error syncing localStorage favorites:', error);
  }
}

export async function removeSavedShift(id: string): Promise<boolean> {
  try {
    // Obtener nombre antes de eliminar para sincronizar localStorage
    const { data: shiftToDelete } = await supabase
      .from('saved_shifts')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('saved_shifts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error removing saved shift:', error);
      return false;
    }
    
    // Clear cache to force fresh reload on next request
    shiftsCache = null;
    
    // SYNC: También eliminar de localStorage favoritos
    syncLocalStorageFavorites(id, shiftToDelete?.name);
    
    return true;
  } catch (error) {
    console.error('Error removing saved shift:', error);
    return false;
  }
}

// Initialize cache on module load - NO AUTO-GENERATION
read().then(async (shifts) => {
  // ❌ ELIMINADO: Auto-generación de turnos por defecto que causaba bucles infinitos
  // El usuario debe crear sus propios turnos manualmente para evitar regeneración automática
});