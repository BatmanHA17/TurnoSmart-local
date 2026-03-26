import { DebugEmailButton } from "@/components/DebugEmailButton";
import { Link } from "react-router-dom";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";

export default function DebugEmails() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors">
          <TurnoSmartLogo size="sm" />
          <span className="font-medium text-sm">TurnoSmart</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Debug Email Functions</h1>
          <p className="text-gray-600">
            Usa esta página para probar y debuggear las funciones de email.
          </p>
        </div>

        <div className="flex justify-center">
          <DebugEmailButton />
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Cambia el email a tu dirección real</li>
            <li>Prueba primero "Test Basic Email (Resend)" para verificar la configuración de Resend</li>
            <li>Si funciona, prueba "Test Simple Signup" para el flujo completo</li>
            <li>Revisa tu bandeja de entrada y spam</li>
            <li>Verifica los logs de las edge functions en Supabase si hay errores</li>
          </ol>
        </div>

        <div className="mt-6 text-center space-x-4">
          <Link 
            to="/register" 
            className="text-blue-600 hover:underline"
          >
            Ir a Registro
          </Link>
          <Link 
            to="/auth" 
            className="text-blue-600 hover:underline"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    </div>
  );
}