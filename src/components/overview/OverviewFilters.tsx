import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { OverviewDateFilter } from './OverviewDateFilter';
import { OverviewSimpleFilter } from './OverviewSimpleFilter';

interface FiltersProps {
  onFiltersChange: (filters: any) => void;
}

export const OverviewFilters: React.FC<FiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    dateRange: 'todoElTiempo',
    establishment: 'todos',
    team: 'todos',
    contractType: 'todos',
    gender: 'todos',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Opciones para los filtros basadas exactamente en las imágenes de Scribe
  const establishmentOptions = [
    { value: 'todos', label: 'Todos los establecimientos' },
    { value: 'hotel-madrid-centro', label: 'Hotel Madrid Centro' },
    { value: 'hotel-barcelona-playa', label: 'Hotel Barcelona Playa' },
    { value: 'restaurante-sevilla', label: 'Restaurante Sevilla' },
    { value: 'hotel-valencia-puerto', label: 'Hotel Valencia Puerto' },
  ];

  const teamOptions = [
    { value: 'todos', label: 'Todos los equipos' },
    { value: 'recepcion', label: 'Recepción' },
    { value: 'pisos', label: 'Pisos' },
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'bar', label: 'Bar' },
    { value: 'cocina', label: 'Cocina' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
  ];

  const contractOptions = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: '8-horas', label: '8 HORAS' },
    { value: '6-horas', label: '6 HORAS' },
    { value: '5-horas', label: '5 HORAS' },
    { value: '4-horas', label: '4 HORAS' },
  ];

  const genderOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' },
  ];

  return (
    <Card className="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Filtro de Fecha */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Fecha:</span>
          <OverviewDateFilter onDateRangeChange={(range) => handleFilterChange('dateRange', range)} />
        </div>

        {/* Filtro de Establecimiento */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Establecimiento:</span>
          <OverviewSimpleFilter
            value={filters.establishment}
            onChange={(value) => handleFilterChange('establishment', value)}
            options={establishmentOptions}
            className="w-56"
          />
        </div>

        {/* Filtro de Equipo */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Equipo:</span>
          <OverviewSimpleFilter
            value={filters.team}
            onChange={(value) => handleFilterChange('team', value)}
            options={teamOptions}
            className="w-44"
          />
        </div>

        {/* Filtro de Tipo de Contrato */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tipo de contrato:</span>
          <OverviewSimpleFilter
            value={filters.contractType}
            onChange={(value) => handleFilterChange('contractType', value)}
            options={contractOptions}
            className="w-36"
          />
        </div>

        {/* Filtro de Género */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Género:</span>
          <OverviewSimpleFilter
            value={filters.gender}
            onChange={(value) => handleFilterChange('gender', value)}
            options={genderOptions}
            className="w-32"
          />
        </div>
      </div>
    </Card>
  );
};