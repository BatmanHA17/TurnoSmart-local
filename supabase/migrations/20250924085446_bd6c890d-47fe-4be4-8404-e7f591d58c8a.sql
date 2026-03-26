-- Crear tabla teams para gestión de equipos
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  org_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT teams_name_org_unique UNIQUE (name, org_id)
);

-- Crear tabla team_members para relaciones colaborador-equipo
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT team_members_unique UNIQUE (team_id, colaborador_id)
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para teams
CREATE POLICY "org_members_manage_teams" ON public.teams
  FOR ALL USING (
    org_id IN (
      SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
    )
  );

-- Políticas RLS para team_members
CREATE POLICY "org_members_manage_team_members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM teams t 
      JOIN memberships m ON t.org_id = m.org_id 
      WHERE m.user_id = auth.uid()
    )
  );

-- Trigger para updated_at en teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para rendimiento
CREATE INDEX idx_teams_org_id ON public.teams(org_id);
CREATE INDEX idx_teams_active ON public.teams(org_id, is_active);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_colaborador_id ON public.team_members(colaborador_id);

-- Función auxiliar para obtener equipos por organización
CREATE OR REPLACE FUNCTION public.get_teams_by_org(org_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  is_active boolean,
  order_index integer,
  member_count bigint,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.name,
    t.description,
    t.is_active,
    t.order_index,
    COUNT(tm.colaborador_id) as member_count,
    t.created_at
  FROM teams t
  LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
  WHERE t.org_id = org_uuid AND t.is_active = true
  GROUP BY t.id, t.name, t.description, t.is_active, t.order_index, t.created_at
  ORDER BY t.order_index, t.name;
$$;

-- Función para asignar colaborador a equipo
CREATE OR REPLACE FUNCTION public.assign_colaborador_to_team(
  colaborador_uuid uuid,
  team_uuid uuid,
  assigned_by_uuid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_org_id uuid;
  colaborador_org_id uuid;
BEGIN
  -- Verificar que el equipo y colaborador pertenecen a la misma organización
  SELECT org_id INTO team_org_id FROM teams WHERE id = team_uuid;
  SELECT org_id INTO colaborador_org_id FROM colaboradores WHERE id = colaborador_uuid;
  
  IF team_org_id IS NULL OR colaborador_org_id IS NULL OR team_org_id != colaborador_org_id THEN
    RETURN false;
  END IF;
  
  -- Insertar o reactivar la asignación
  INSERT INTO team_members (team_id, colaborador_id, assigned_by, is_active)
  VALUES (team_uuid, colaborador_uuid, assigned_by_uuid, true)
  ON CONFLICT (team_id, colaborador_id) 
  DO UPDATE SET 
    is_active = true,
    assigned_at = now(),
    assigned_by = assigned_by_uuid;
  
  RETURN true;
END;
$$;

-- Función para remover colaborador de equipo
CREATE OR REPLACE FUNCTION public.remove_colaborador_from_team(
  colaborador_uuid uuid,
  team_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE team_members 
  SET is_active = false
  WHERE team_id = team_uuid AND colaborador_id = colaborador_uuid;
  
  RETURN FOUND;
END;
$$;