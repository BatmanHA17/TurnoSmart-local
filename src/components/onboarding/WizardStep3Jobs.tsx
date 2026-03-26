import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobData, DepartmentData } from '@/hooks/useOnboardingWizard';
import { CONTRACT_HOURS } from './wizardTemplates';

interface WizardStep3JobsProps {
  jobs: JobData[];
  departments: DepartmentData[];
  onToggle: (id: string) => void;
  onAdd: (title: string, departmentId: string, departmentName: string, hours: number) => void;
  onRemove: (id: string) => void;
  onUpdateHours: (id: string, hours: number) => void;
  onUpdateHeadcount: (id: string, headcount: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export const WizardStep3Jobs: React.FC<WizardStep3JobsProps> = ({
  jobs,
  departments,
  onToggle,
  onAdd,
  onRemove,
  onUpdateHours,
  onUpdateHeadcount,
  onNext,
  onBack,
}) => {
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('');
  const [newJobHours, setNewJobHours] = useState(8);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedDepartments = departments.filter(d => d.selected);

  const handleAddJob = () => {
    if (newJobTitle.trim() && newJobDept) {
      const dept = departments.find(d => d.id === newJobDept);
      if (dept) {
        onAdd(newJobTitle.trim(), newJobDept, dept.name, newJobHours);
        setNewJobTitle('');
        setShowAddForm(false);
      }
    }
  };

  // Only jobs from selected departments
  const relevantJobs = jobs.filter(job =>
    selectedDepartments.some(d => d.id === job.departmentId) || job.id.startsWith('custom-')
  );

  const selectedJobs = relevantJobs.filter(j => j.selected);
  const totalHeadcount = selectedJobs.reduce((sum, j) => sum + (j.headcount || 1), 0);
  const isValid = selectedJobs.length > 0;

  // Group by department
  const jobsByDept = relevantJobs.reduce((acc, job) => {
    const deptName = job.departmentName;
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(job);
    return acc;
  }, {} as Record<string, JobData[]>);

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent-orange-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-accent-orange-text" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Puestos de trabajo
        </h2>
        <p className="text-muted-foreground text-sm">
          Selecciona los roles de tu equipo e indica cuántas personas los desempeñan
        </p>
      </div>

      {/* Total plantilla badge */}
      <div className="flex items-center justify-between px-4 py-3 bg-accent-blue-bg/40 rounded-lg border border-accent-blue-text/20">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4 text-accent-blue-text" />
          <span>Plantilla total</span>
        </div>
        <span className="text-lg font-bold text-accent-blue-text">{totalHeadcount} personas</span>
      </div>

      {/* Jobs list grouped by department */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {Object.entries(jobsByDept).map(([deptName, deptJobs]) => {
          const deptSelected = deptJobs.filter(j => j.selected);
          const deptHeadcount = deptSelected.reduce((sum, j) => sum + (j.headcount || 1), 0);
          return (
            <div key={deptName} className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {deptName}
                </h3>
                {deptHeadcount > 0 && (
                  <span className="text-xs text-accent-blue-text font-medium">
                    {deptHeadcount} persona{deptHeadcount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {deptJobs.map((job) => (
                <div
                  key={job.id}
                  className={`
                    flex items-center gap-2 p-2.5 rounded-lg border transition-all
                    ${job.selected
                      ? 'bg-accent-orange-bg/40 border-accent-orange-text/25'
                      : 'bg-muted/20 border-border opacity-60'
                    }
                  `}
                >
                  <Checkbox
                    id={job.id}
                    checked={job.selected}
                    onCheckedChange={() => onToggle(job.id)}
                    className="shrink-0"
                  />
                  <label
                    htmlFor={job.id}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {job.title}
                  </label>

                  {job.selected && (
                    <>
                      {/* Headcount */}
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={job.headcount || 1}
                          onChange={(e) => onUpdateHeadcount(job.id, parseInt(e.target.value) || 1)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-7 text-center text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Hours */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <Select
                          value={job.hours.toString()}
                          onValueChange={(value) => onUpdateHours(job.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-[80px] h-7 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_HOURS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.value}h
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {job.id.startsWith('custom-') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => onRemove(job.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Add custom role */}
      <div className="border border-dashed rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Añadir puesto personalizado
          </span>
          {showAddForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAddForm && (
          <div className="p-3 bg-muted/20 border-t space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Nombre del puesto..."
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddJob()}
                className="h-9 flex-1 min-w-[150px]"
              />
              <Select value={newJobDept} onValueChange={setNewJobDept}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newJobHours.toString()} onValueChange={(v) => setNewJobHours(parseInt(v))}>
                <SelectTrigger className="w-[80px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_HOURS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.value}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddJob}
                disabled={!newJobTitle.trim() || !newJobDept}
                className="h-9 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1 h-12">
          Continuar
        </Button>
      </div>
    </div>
  );
};
