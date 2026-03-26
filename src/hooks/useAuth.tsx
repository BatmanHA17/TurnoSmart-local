import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Inicializando sistema de autenticación...');
    
    // Configurar el listener de cambios de autenticación PRIMERO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('=== CAMBIO DE ESTADO DE AUTH ===');
        console.log('Evento:', event);
        console.log('Sesión existe:', session ? 'SÍ' : 'NO');
        
        // Solo actualizaciones síncronas aquí para evitar deadlocks
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log para debugging
        if (session) {
          console.log('✅ Usuario autenticado:', session.user.email);
        } else {
          console.log('❌ Usuario no autenticado');
        }
      }
    );

    // DESPUÉS verificar si ya existe una sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('=== VERIFICACIÓN INICIAL DE SESIÓN ===');
      console.log('Sesión encontrada:', session ? 'SÍ' : 'NO');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        console.log('✅ Sesión restaurada para:', session.user.email);
      }
    });

    // Limpiar al desmontar
    return () => {
      console.log('🧹 Limpiando listener de auth');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando proceso de logout');
      
      // Limpiar estado local inmediatamente
      setSession(null);
      setUser(null);
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // Limpiar datos adicionales de la app
      try { 
        localStorage.removeItem('turnosmart_configuration'); 
        localStorage.removeItem('calendar-employees');
      } catch {}
      
      toast.success("Sesión cerrada correctamente");
      
      // Redirigir a la página de autenticación
      setTimeout(() => {
        window.location.replace("/auth");
      }, 500);
      
    } catch (err) {
      console.error("Error durante logout:", err);
      // En caso de error, limpiar estado de todas formas
      setSession(null);
      setUser(null);
      toast.success("Sesión cerrada");
      window.location.replace("/auth");
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};