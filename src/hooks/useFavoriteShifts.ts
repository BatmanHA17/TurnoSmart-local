import { useState, useEffect } from 'react';
import { SavedShift } from "@/store/savedShiftsStore";
import { toast } from "sonner";

const FAVORITES_STORAGE_KEY = 'turnosmart-favorite-shifts';

export const useFavoriteShifts = () => {
  const [favoriteShifts, setFavoriteShifts] = useState<SavedShift[]>([]);

  // Cargar favoritos desde localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Filtrar duplicados de "Descanso Semanal" - solo debe haber uno por defecto
        const cleanedFavorites = parsed.filter((shift: SavedShift) => 
          shift.name !== "Descanso Semanal" && shift.accessType !== 'absence'
        );
        
        setFavoriteShifts(cleanedFavorites);
        
        // Si se encontraron duplicados, guardar la versión limpia
        if (cleanedFavorites.length !== parsed.length) {
          saveFavorites(cleanedFavorites);
          console.log("Duplicados de Descanso Semanal eliminados");
        }
        
        console.log("Favoritos cargados y limpiados:", cleanedFavorites);
      }
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    }
  }, []);

  // Guardar favoritos en localStorage
  const saveFavorites = (shifts: SavedShift[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(shifts));
      console.log("Favoritos guardados:", shifts);
    } catch (error) {
      console.error("Error guardando favoritos:", error);
    }
  };

  // Añadir horario a favoritos
  const addToFavorites = (shift: SavedShift) => {
    // Verificar si es "Descanso Semanal" - no permitir duplicados
    if (shift.name === "Descanso Semanal" || shift.accessType === 'absence') {
      toast.info("El horario de descanso semanal ya está disponible por defecto");
      return;
    }
    
    // Verificar si ya existe otro horario con el mismo nombre
    const exists = favoriteShifts.some(fav => 
      fav.name.toLowerCase() === shift.name.toLowerCase()
    );
    if (exists) {
      toast.info(`El horario "${shift.name}" ya está en favoritos`);
      return;
    }

    const newFavorites = [...favoriteShifts, shift];
    setFavoriteShifts(newFavorites);
    saveFavorites(newFavorites);
    toast.success(`"${shift.name}" añadido a favoritos`);
  };

  // Eliminar horario de favoritos
  const removeFromFavorites = (shiftId: string) => {
    const newFavorites = favoriteShifts.filter(fav => fav.id !== shiftId);
    setFavoriteShifts(newFavorites);
    saveFavorites(newFavorites);
    toast.success("Horario eliminado de favoritos");
  };

  // Verificar si un horario está en favoritos
  const isFavorite = (shiftId: string) => {
    return favoriteShifts.some(fav => fav.id === shiftId);
  };

  return {
    favoriteShifts,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  };
};