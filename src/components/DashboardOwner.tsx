import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard placeholder para el rol OWNER.
 * Vista temporal mientras se desarrolla el dashboard definitivo.
 */
const DashboardOwner = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Muy pronto</CardTitle>
          <CardDescription className="text-base mt-2">
            Estamos preparando tu nuevo panel de propietario.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Mientras tanto, puedes gestionar tu organización desde el menú lateral.
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOwner;