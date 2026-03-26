import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";

export default function DatabaseCleanup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFullCleanup = async () => {
    if (!confirm("⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos. Esta acción NO se puede deshacer. ¿Estás seguro?")) {
      return;
    }

    if (!confirm("⚠️ ÚLTIMA CONFIRMACIÓN: Se eliminarán usuarios, organizaciones, colaboradores, cuadrantes y TODOS los datos. ¿Continuar?")) {
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-database');
      
      if (error) {
        console.error('Error en limpieza:', error);
        toast.error(`Error durante la limpieza: ${error.message}`);
        return;
      }

      setResults(data);
      
      if (data.success) {
        toast.success("🎉 Base de datos limpiada completamente");
      } else {
        toast.error("❌ Error durante la limpieza");
      }
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUserCleanup = async () => {
    if (!confirm("¿Limpiar solo usuarios? (mantiene datos de aplicación)")) {
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-all-users');
      
      if (error) {
        console.error('Error en limpieza de usuarios:', error);
        toast.error(`Error: ${error.message}`);
        return;
      }

      setResults(data);
      toast.success("🧹 Usuarios eliminados");
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-red-600">Limpieza de Base de Datos</h1>
          <p className="text-gray-600">Herramientas para limpiar datos y empezar pruebas desde cero</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Limpieza Completa */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Limpieza Completa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">¡PELIGRO!</p>
                    <p>Elimina TODOS los datos:</p>
                    <ul className="mt-1 text-xs list-disc list-inside space-y-1">
                      <li>Todos los usuarios (auth.users)</li>
                      <li>Organizaciones y memberships</li>
                      <li>Colaboradores y perfiles</li>
                      <li>Cuadrantes y turnos</li>
                      <li>Ausencias y permisos</li>
                      <li>Logs de actividad</li>
                      <li>Configuraciones</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleFullCleanup}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? "Limpiando..." : "🗑️ Limpiar TODO"}
              </Button>
            </CardContent>
          </Card>

          {/* Limpieza de Usuarios */}
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Trash2 className="w-5 h-5" />
                Solo Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
                <p>Elimina solo usuarios de auth.users</p>
                <p className="text-xs mt-1">Mantiene datos de aplicación</p>
              </div>
              
              <Button 
                onClick={handleQuickUserCleanup}
                disabled={loading}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                {loading ? "Limpiando..." : "🧹 Limpiar Usuarios"}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          {results && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resultados de Limpieza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    <p className="font-semibold">{results.message}</p>
                  </div>
                  
                  {results.results && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Usuarios Eliminados</p>
                        <p className="text-2xl font-bold text-blue-800">{results.results.usersDeleted || results.successCount || 0}</p>
                      </div>
                      
                      {results.results.tablesCleared !== undefined && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-600">Tablas Limpiadas</p>
                          <p className="text-2xl font-bold text-purple-800">{results.results.tablesCleared}</p>
                        </div>
                      )}
                      
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Errores</p>
                        <p className="text-2xl font-bold text-red-800">{results.results.errorCount || results.errorCount || 0}</p>
                      </div>
                    </div>
                  )}
                  
                  {results.results?.errors && results.results.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="font-semibold text-red-800 mb-2">Errores encontrados:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {results.results.errors.map((error: string, index: number) => (
                          <li key={index} className="font-mono text-xs">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.results?.tablesClearedList && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <p className="font-semibold text-green-800 mb-2">Tablas limpiadas exitosamente:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {results.results.tablesClearedList.map((table: string, index: number) => (
                          <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enlaces útiles */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <a href="/auth" className="text-blue-600 hover:underline">→ Registro</a>
              <a href="/auth" className="text-blue-600 hover:underline">→ Login</a>
              <a href="/test-password-flow" className="text-blue-600 hover:underline">→ Test Auth Flow</a>
              <a href="/home" className="text-blue-600 hover:underline">→ Landing</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}