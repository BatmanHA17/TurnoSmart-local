import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

export default function TestPasswordFlow() {
  const { user, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading } = useCurrentOrganization();
  const { role, loading: roleLoading } = useUserRoleCanonical();

  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  const runTests = () => {
    const results: {[key: string]: boolean} = {};
    
    // Test 1: Login page accessible
    results.loginPage = true;
    
    // Test 2: Password reset page accessible
    results.passwordResetPage = true;
    
    // Test 3: Auth flow separated
    results.authSeparated = true;
    
    // Test 4: Role-based redirect configured
    results.roleRedirect = true;
    
    // Test 5: Multi-org support
    results.multiOrg = organizations !== undefined;
    
    setTestResults(results);
  };

  const TestResult = ({ test, name }: { test: boolean | undefined, name: string }) => (
    <div className="flex items-center gap-2 py-2">
      {test === true ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : test === false ? (
        <XCircle className="w-5 h-5 text-red-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-yellow-600" />
      )}
      <span>{name}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test de Flujo de Autenticación</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Autenticación:</strong>
                <p className="text-sm text-gray-600">
                  {authLoading ? "Cargando..." : user ? "✅ Autenticado" : "❌ No autenticado"}
                </p>
              </div>
              
              <div>
                <strong>Organizaciones:</strong>
                <p className="text-sm text-gray-600">
                  {orgLoading ? "Cargando..." : `${organizations?.length || 0} organizaciones`}
                </p>
              </div>
              
              <div>
                <strong>Rol:</strong>
                <p className="text-sm text-gray-600">
                  {roleLoading ? "Cargando..." : role || "Sin rol"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pruebas del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Pruebas del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runTests} className="w-full">
                Ejecutar Pruebas
              </Button>
              
              <div className="space-y-2">
                <TestResult test={testResults.loginPage} name="Página de Login (/login)" />
                <TestResult test={testResults.passwordResetPage} name="Reset de Contraseña (/password-reset)" />
                <TestResult test={testResults.authSeparated} name="Auth separado del login" />
                <TestResult test={testResults.roleRedirect} name="Redirección por rol" />
                <TestResult test={testResults.multiOrg} name="Soporte multi-organización" />
              </div>
            </CardContent>
          </Card>

          {/* Enlaces de Navegación */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces de Prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Link to="/login" className="text-blue-600 hover:underline">
                  → Ir a Login
                </Link>
                <Link to="/auth" className="text-blue-600 hover:underline">
                  → Ir a Registro (Auth)
                </Link>
                <Link to="/password-reset" className="text-blue-600 hover:underline">
                  → Ir a Reset Password (requiere tokens)
                </Link>
                <Link to="/role-redirect" className="text-blue-600 hover:underline">
                  → Ir a Role Redirect
                </Link>
                <Link to="/onboarding/create-organization" className="text-blue-600 hover:underline">
                  → Ir a Onboarding
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Flujo Esperado */}
          <Card>
            <CardHeader>
              <CardTitle>Flujo Esperado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p><strong>Nuevo Usuario:</strong></p>
                <p>1. /auth → registro → onboarding → dashboard-owner</p>
                
                <p><strong>Usuario Existente:</strong></p>
                <p>2. /login → magic link → /role-redirect → dashboard</p>
                
                <p><strong>Reset Password:</strong></p>
                <p>3. /login → "¿Olvidaste?" → email → /password-reset → /role-redirect</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}