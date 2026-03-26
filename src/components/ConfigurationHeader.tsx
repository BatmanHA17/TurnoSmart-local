import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConfigurationHeaderProps {
  title: string;
  description: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ConfigurationHeader = ({ 
  title, 
  description, 
  onBack, 
  showBackButton = false 
}: ConfigurationHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          )}
        </div>
        
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleHome}
          className="h-8"
        >
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Button>
      </div>
    </div>
  );
};