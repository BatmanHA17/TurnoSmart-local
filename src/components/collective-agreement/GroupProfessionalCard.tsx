import { useState } from 'react';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SalaryLevel {
  id: string;
  level_code: string;
  level_name: string;
  base_salary?: number;
  currency: string;
  period: string;
  description?: string;
}

interface ProfessionalGroup {
  id: string;
  group_code: string;
  group_name: string;
  description?: string;
  salary_levels: SalaryLevel[];
}

interface GroupProfessionalCardProps {
  group: ProfessionalGroup;
  onUpdate: (group: ProfessionalGroup) => void;
  onDelete: (groupId: string) => void;
  isEditable?: boolean;
}

export function GroupProfessionalCard({ 
  group, 
  onUpdate, 
  onDelete, 
  isEditable = true 
}: GroupProfessionalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<ProfessionalGroup>(group);

  const handleSave = () => {
    onUpdate(editedGroup);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGroup(group);
    setIsEditing(false);
  };

  const addSalaryLevel = () => {
    const newLevel: SalaryLevel = {
      id: `temp-${Date.now()}`,
      level_code: `NIV${editedGroup.salary_levels.length + 1}`,
      level_name: '',
      base_salary: 0,
      currency: 'EUR',
      period: 'monthly',
      description: ''
    };
    
    setEditedGroup({
      ...editedGroup,
      salary_levels: [...editedGroup.salary_levels, newLevel]
    });
  };

  const updateSalaryLevel = (index: number, field: keyof SalaryLevel, value: any) => {
    const updatedLevels = [...editedGroup.salary_levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setEditedGroup({ ...editedGroup, salary_levels: updatedLevels });
  };

  const removeSalaryLevel = (index: number) => {
    const updatedLevels = editedGroup.salary_levels.filter((_, i) => i !== index);
    setEditedGroup({ ...editedGroup, salary_levels: updatedLevels });
  };

  const formatSalary = (amount?: number, currency: string = 'EUR', period: string = 'monthly') => {
    if (!amount) return '-';
    const periodText = {
      hourly: '/hora',
      daily: '/día',
      weekly: '/semana',
      monthly: '/mes',
      annual: '/año'
    }[period] || '/mes';
    
    return `${amount.toLocaleString('es-ES', { style: 'currency', currency })}${periodText}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={editedGroup.group_code}
                    onChange={(e) => setEditedGroup({ ...editedGroup, group_code: e.target.value })}
                    placeholder="Código del grupo"
                    className="text-sm font-medium"
                  />
                  <Input
                    value={editedGroup.group_name}
                    onChange={(e) => setEditedGroup({ ...editedGroup, group_name: e.target.value })}
                    placeholder="Nombre del grupo"
                    className="text-lg font-semibold"
                  />
                </div>
                <Textarea
                  value={editedGroup.description || ''}
                  onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                  placeholder="Descripción del grupo profesional"
                  className="text-sm"
                  rows={2}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {group.group_code}
                  </Badge>
                  <h3 className="text-lg font-semibold">{group.group_name}</h3>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
            )}
          </div>
          
          {isEditable && (
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onDelete(group.id)} 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Niveles Salariales ({editedGroup.salary_levels.length})
            </h4>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addSalaryLevel} className="h-7 px-2">
                <Plus className="h-3 w-3 mr-1" />
                Añadir
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {editedGroup.salary_levels.map((level, index) => (
              <div key={level.id} className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
                {isEditing ? (
                  <>
                    <Input
                      value={level.level_code}
                      onChange={(e) => updateSalaryLevel(index, 'level_code', e.target.value)}
                      placeholder="Código"
                      className="w-20 h-8 text-xs"
                    />
                    <Input
                      value={level.level_name}
                      onChange={(e) => updateSalaryLevel(index, 'level_name', e.target.value)}
                      placeholder="Nombre del nivel"
                      className="flex-1 h-8 text-xs"
                    />
                    <Input
                      type="number"
                      value={level.base_salary || ''}
                      onChange={(e) => updateSalaryLevel(index, 'base_salary', parseFloat(e.target.value) || 0)}
                      placeholder="Salario"
                      className="w-24 h-8 text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeSalaryLevel(index)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      {level.level_code}
                    </Badge>
                    <span className="flex-1 text-sm">{level.level_name}</span>
                    <span className="text-sm font-medium text-primary">
                      {formatSalary(level.base_salary, level.currency, level.period)}
                    </span>
                  </>
                )}
              </div>
            ))}
            
            {editedGroup.salary_levels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se han definido niveles salariales
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}