import { cn } from "@/lib/utils";

interface StatusCellProps {
  status: string;
  className?: string;
  onClick?: () => void;
}

export function StatusCell({ status, className, onClick }: StatusCellProps) {
  const getStatusStyle = (status: string) => {
    const baseClasses = "inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded-lg transition-all duration-300 shadow-soft";
    
    switch (status.toUpperCase()) {
      case 'X':
        return `${baseClasses} bg-matcha-light text-stone border border-matcha/20`;
      case 'XB':
        return `${baseClasses} bg-bamboo-light text-stone border border-bamboo/20`;
      case 'L':
        return `${baseClasses} bg-sky-light text-stone border border-sky/20`;
      case 'V':
        return `${baseClasses} bg-sunset-light text-stone border border-sunset/20`;
      case 'E':
        return `${baseClasses} bg-accent text-stone border border-accent/20`;
      case 'F':
        return `${baseClasses} bg-destructive/20 text-destructive border border-destructive/20`;
      case 'P':
        return `${baseClasses} bg-sky-light text-stone border border-sky/20`;
      case 'C':
        return `${baseClasses} bg-sakura-light text-stone border border-sakura/20`;
      case 'H':
        return `${baseClasses} bg-sunset-light text-stone border border-sunset/20`;
      case 'S':
        return `${baseClasses} bg-stone-light text-stone border border-stone/20`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground border border-border`;
    }
  };

  return (
    <div 
      className={cn(getStatusStyle(status), className)} 
      onClick={onClick}
    >
      {status || '–'}
    </div>
  );
}