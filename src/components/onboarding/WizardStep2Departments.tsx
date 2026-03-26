import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { DepartmentData } from '@/hooks/useOnboardingWizard';

interface WizardStep2DepartmentsProps {
  departments: DepartmentData[];
  industryLabel: string;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const WizardStep2Departments: React.FC<WizardStep2DepartmentsProps> = ({
  departments,
  industryLabel,
  onToggle,
  onAdd,
  onRemove,
  onNext,
  onBack,
}) => {
  const [newDeptName, setNewDeptName] = useState('');

  const handleAddDepartment = () => {
    if (newDeptName.trim()) {
      onAdd(newDeptName.trim());
      setNewDeptName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddDepartment();
    }
  };

  const selectedCount = departments.filter(d => d.selected).length;
  const isValid = selectedCount > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-purple-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-accent-purple-text" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Departamentos / Equipos
        </h2>
        <p className="text-muted-foreground">
          {departments.length > 0 
            ? `Sugerencias para ${industryLabel}. Selecciona los que necesites.`
            : 'Añade los departamentos de tu organización'
          }
        </p>
      </div>

      {/* Department list */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${dept.selected 
                ? 'bg-accent-green-bg/50 border-accent-green-text/30' 
                : 'bg-muted/30 border-border'
              }
            `}
          >
            <Checkbox
              id={dept.id}
              checked={dept.selected}
              onCheckedChange={() => onToggle(dept.id)}
            />
            <label
              htmlFor={dept.id}
              className="flex-1 text-sm font-medium cursor-pointer"
            >
              {dept.name}
            </label>
            {dept.id.startsWith('custom-') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(dept.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new department */}
      <div className="flex gap-2">
        <Input
          placeholder="Añadir departamento personalizado..."
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10"
        />
        <Button
          variant="outline"
          onClick={handleAddDepartment}
          disabled={!newDeptName.trim()}
          className="h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-1" />
          Añadir
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {selectedCount} departamento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
      </p>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12"
        >
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 h-12"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
