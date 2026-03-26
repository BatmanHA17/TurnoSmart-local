import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner = ({ text = "Cargando..." }: LoadingSpinnerProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};
