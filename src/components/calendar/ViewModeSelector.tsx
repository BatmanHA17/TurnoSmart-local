import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode";

export function ViewModeSelector() {
  const { currentView, views, changeView } = useCalendarViewMode();

  const currentViewData = views.find(v => v.id === currentView);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          {currentViewData && <currentViewData.icon className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentViewData?.label || "Vista"}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="min-w-[180px] bg-popover border border-border shadow-lg"
        sideOffset={4}
      >
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = view.id === currentView;
          
          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => changeView(view)}
              className="gap-2 cursor-pointer"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{view.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
