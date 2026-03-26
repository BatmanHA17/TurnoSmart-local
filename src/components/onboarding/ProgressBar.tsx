interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground font-normal">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground font-normal">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-muted-foreground/20 rounded-full h-0.5">
        <div 
          className="bg-foreground h-0.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}