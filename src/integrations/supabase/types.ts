export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      absence_requests: {
        Row: {
          colaborador_id: string
          created_at: string
          employee_name: string
          end_date: string
          id: string
          leave_type: string
          manager_comment: string | null
          org_id: string | null
          processed_by: string | null
          processed_date: string | null
          reason: string | null
          start_date: string
          status: string
          submitted_date: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          employee_name: string
          end_date: string
          id?: string
          leave_type: string
          manager_comment?: string | null
          org_id?: string | null
          processed_by?: string | null
          processed_date?: string | null
          reason?: string | null
          start_date: string
          status?: string
          submitted_date?: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          employee_name?: string
          end_date?: string
          id?: string
          leave_type?: string
          manager_comment?: string | null
          org_id?: string | null
          processed_by?: string | null
          processed_date?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          submitted_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "absence_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          establishment: string | null
          id: string
          org_id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          establishment?: string | null
          id?: string
          org_id: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          establishment?: string | null
          id?: string
          org_id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_extractions: {
        Row: {
          agreement_id: string
          ai_model_used: string | null
          confidence_score: number | null
          created_at: string
          errors: Json | null
          extraction_prompt: string | null
          extraction_type: string
          groups_extracted: number
          id: string
          levels_extracted: number
          org_id: string
          processed_by: string
          processing_time_ms: number | null
          raw_response: string | null
        }
        Insert: {
          agreement_id: string
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string
          errors?: Json | null
          extraction_prompt?: string | null
          extraction_type: string
          groups_extracted?: number
          id?: string
          levels_extracted?: number
          org_id: string
          processed_by: string
          processing_time_ms?: number | null
          raw_response?: string | null
        }
        Update: {
          agreement_id?: string
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string
          errors?: Json | null
          extraction_prompt?: string | null
          extraction_type?: string
          groups_extracted?: number
          id?: string
          levels_extracted?: number
          org_id?: string
          processed_by?: string
          processing_time_ms?: number | null
          raw_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_extractions_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_interactions: {
        Row: {
          agreement_id: string
          created_at: string
          created_by: string
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          org_id: string
          prompt: string
          response: Json | null
          status: string
        }
        Insert: {
          agreement_id: string
          created_at?: string
          created_by: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: string
          org_id: string
          prompt: string
          response?: Json | null
          status: string
        }
        Update: {
          agreement_id?: string
          created_at?: string
          created_by?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          prompt?: string
          response?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_interactions_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_text_chunks: {
        Row: {
          agreement_id: string
          content: string
          created_at: string
          id: string
          idx: number
          org_id: string
        }
        Insert: {
          agreement_id: string
          content: string
          created_at?: string
          id?: string
          idx: number
          org_id: string
        }
        Update: {
          agreement_id?: string
          content?: string
          created_at?: string
          id?: string
          idx?: number
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_text_chunks_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_policies: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          org_id: string
          policy_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          org_id: string
          policy_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          org_id?: string
          policy_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "audit_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_violations_log: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          colaborador_id: string | null
          created_at: string
          details: Json | null
          id: string
          justification: string | null
          org_id: string
          violation_date: string
          violation_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          colaborador_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          justification?: string | null
          org_id: string
          violation_date: string
          violation_type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          colaborador_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          justification?: string | null
          org_id?: string
          violation_date?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_violations_log_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_violations_log_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_violations_log_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_violations_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "audit_violations_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_shifts: {
        Row: {
          break_duration: string | null
          color: string
          created_at: string
          date: string
          employee_id: string
          end_time: string | null
          id: string
          notes: string | null
          org_id: string
          organization: string | null
          shift_name: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          break_duration?: string | null
          color?: string
          created_at?: string
          date: string
          employee_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          org_id: string
          organization?: string | null
          shift_name: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          break_duration?: string | null
          color?: string
          created_at?: string
          date?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          organization?: string | null
          shift_name?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "calendar_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_auto_save: boolean
          org_id: string
          snapshot_data: Json
          updated_at: string
          version_name: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_auto_save?: boolean
          org_id: string
          snapshot_data: Json
          updated_at?: string
          version_name: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_auto_save?: boolean
          org_id?: string
          snapshot_data?: Json
          updated_at?: string
          version_name?: string
          version_number?: number
        }
        Relationships: []
      }
      colaborador_departments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          colaborador_id: string
          created_at: string
          department_id: string
          id: string
          is_active: boolean
          org_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          colaborador_id: string
          created_at?: string
          department_id: string
          id?: string
          is_active?: boolean
          org_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          colaborador_id?: string
          created_at?: string
          department_id?: string
          id?: string
          is_active?: boolean
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_departments_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_departments_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "job_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_organization_access: {
        Row: {
          colaborador_id: string
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_organization_access_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_organization_access_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_organization_access_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "colaborador_organization_access_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_roles: {
        Row: {
          activo: boolean | null
          asignado_en: string | null
          asignado_por: string | null
          colaborador_id: string
          departamento: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["hotel_role"]
        }
        Insert: {
          activo?: boolean | null
          asignado_en?: string | null
          asignado_por?: string | null
          colaborador_id: string
          departamento?: string | null
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["hotel_role"]
        }
        Update: {
          activo?: boolean | null
          asignado_en?: string | null
          asignado_por?: string | null
          colaborador_id?: string
          departamento?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["hotel_role"]
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_roles_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_roles_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "colaborador_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          apellidos: string
          apellidos_nacimiento: string | null
          apellidos_uso: string | null
          avatar_url: string | null
          ciudad: string | null
          ciudad_nacimiento: string | null
          codigo_postal: string | null
          created_at: string
          direccion: string | null
          disponibilidad_semanal: Json | null
          email: string
          empleado_id: string | null
          estado_civil: string | null
          fecha_antiguedad: string | null
          fecha_fin_contrato: string | null
          fecha_inicio_contrato: string | null
          fecha_nacimiento: string | null
          genero: string | null
          has_generalized_access: boolean
          hora_inicio_contrato: string | null
          id: string
          job_id: string | null
          nacionalidad: string | null
          nombre: string
          numero_personas_dependientes: number | null
          org_id: string
          pais_fijo: string | null
          pais_movil: string | null
          pais_nacimiento: string | null
          pais_residencia: string | null
          provincia: string | null
          responsable_directo: string | null
          status: string | null
          telefono_fijo: string | null
          telefono_movil: string | null
          tiempo_trabajo_semanal: number | null
          tipo_contrato: string | null
          updated_at: string
        }
        Insert: {
          apellidos: string
          apellidos_nacimiento?: string | null
          apellidos_uso?: string | null
          avatar_url?: string | null
          ciudad?: string | null
          ciudad_nacimiento?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion?: string | null
          disponibilidad_semanal?: Json | null
          email: string
          empleado_id?: string | null
          estado_civil?: string | null
          fecha_antiguedad?: string | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          has_generalized_access?: boolean
          hora_inicio_contrato?: string | null
          id?: string
          job_id?: string | null
          nacionalidad?: string | null
          nombre: string
          numero_personas_dependientes?: number | null
          org_id: string
          pais_fijo?: string | null
          pais_movil?: string | null
          pais_nacimiento?: string | null
          pais_residencia?: string | null
          provincia?: string | null
          responsable_directo?: string | null
          status?: string | null
          telefono_fijo?: string | null
          telefono_movil?: string | null
          tiempo_trabajo_semanal?: number | null
          tipo_contrato?: string | null
          updated_at?: string
        }
        Update: {
          apellidos?: string
          apellidos_nacimiento?: string | null
          apellidos_uso?: string | null
          avatar_url?: string | null
          ciudad?: string | null
          ciudad_nacimiento?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion?: string | null
          disponibilidad_semanal?: Json | null
          email?: string
          empleado_id?: string | null
          estado_civil?: string | null
          fecha_antiguedad?: string | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          has_generalized_access?: boolean
          hora_inicio_contrato?: string | null
          id?: string
          job_id?: string | null
          nacionalidad?: string | null
          nombre?: string
          numero_personas_dependientes?: number | null
          org_id?: string
          pais_fijo?: string | null
          pais_movil?: string | null
          pais_nacimiento?: string | null
          pais_residencia?: string | null
          provincia?: string | null
          responsable_directo?: string | null
          status?: string | null
          telefono_fijo?: string | null
          telefono_movil?: string | null
          tiempo_trabajo_semanal?: number | null
          tipo_contrato?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "colaboradores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_colaboradores_job"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_agreements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          extraction_data: Json | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          raw_text: string | null
          status: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          extraction_data?: Json | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          raw_text?: string | null
          status?: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          extraction_data?: Json | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          raw_text?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: []
      }
      compensatory_time_history: {
        Row: {
          action_description: string
          colaborador_id: string
          created_at: string
          hours_change: number
          id: string
          org_id: string | null
          performed_by: string
        }
        Insert: {
          action_description: string
          colaborador_id: string
          created_at?: string
          hours_change: number
          id?: string
          org_id?: string | null
          performed_by: string
        }
        Update: {
          action_description?: string
          colaborador_id?: string
          created_at?: string
          hours_change?: number
          id?: string
          org_id?: string | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "compensatory_time_history_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatory_time_history_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatory_time_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "compensatory_time_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compensatory_time_off: {
        Row: {
          balance_hours: number
          colaborador_id: string
          created_at: string
          id: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          balance_hours?: number
          colaborador_id: string
          created_at?: string
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          balance_hours?: number
          colaborador_id?: string
          created_at?: string
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compensatory_time_off_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatory_time_off_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compensatory_time_off_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "compensatory_time_off_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_history: {
        Row: {
          change_description: string | null
          change_type: string
          changed_by: string | null
          colaborador_id: string
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          org_id: string | null
        }
        Insert: {
          change_description?: string | null
          change_type: string
          changed_by?: string | null
          colaborador_id: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string | null
        }
        Update: {
          change_description?: string | null
          change_type?: string
          changed_by?: string | null
          colaborador_id?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_history_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "contract_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_policies: {
        Row: {
          applies_to_days: Json | null
          created_at: string
          end_time: string
          id: string
          is_enabled: boolean
          min_employees: number
          name: string
          org_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          applies_to_days?: Json | null
          created_at?: string
          end_time: string
          id?: string
          is_enabled?: boolean
          min_employees?: number
          name: string
          org_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          applies_to_days?: Json | null
          created_at?: string
          end_time?: string
          id?: string
          is_enabled?: boolean
          min_employees?: number
          name?: string
          org_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "coverage_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_banking: {
        Row: {
          bic: string | null
          colaborador_id: string
          created_at: string | null
          iban: string | null
          id: string
          nombre_titular: string | null
          numero_identificacion_interna: string | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          bic?: string | null
          colaborador_id: string
          created_at?: string | null
          iban?: string | null
          id?: string
          nombre_titular?: string | null
          numero_identificacion_interna?: string | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          bic?: string | null
          colaborador_id?: string
          created_at?: string | null
          iban?: string | null
          id?: string
          nombre_titular?: string | null
          numero_identificacion_interna?: string | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_banking_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_banking_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_banking_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "employee_banking_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_emergency_contacts: {
        Row: {
          apellidos: string | null
          colaborador_id: string
          created_at: string | null
          id: string
          nombre: string | null
          org_id: string
          pais_fijo: string | null
          pais_movil: string | null
          relacion: string | null
          telefono_fijo: string | null
          telefono_movil: string | null
          updated_at: string | null
        }
        Insert: {
          apellidos?: string | null
          colaborador_id: string
          created_at?: string | null
          id?: string
          nombre?: string | null
          org_id: string
          pais_fijo?: string | null
          pais_movil?: string | null
          relacion?: string | null
          telefono_fijo?: string | null
          telefono_movil?: string | null
          updated_at?: string | null
        }
        Update: {
          apellidos?: string | null
          colaborador_id?: string
          created_at?: string | null
          id?: string
          nombre?: string | null
          org_id?: string
          pais_fijo?: string | null
          pais_movil?: string | null
          relacion?: string | null
          telefono_fijo?: string | null
          telefono_movil?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_emergency_contacts_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_emergency_contacts_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_emergency_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "employee_emergency_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_health: {
        Row: {
          colaborador_id: string
          created_at: string | null
          es_extranjero: boolean | null
          exonerado_seguro_medico: boolean | null
          minusvalia: boolean | null
          numero_seguridad_social: string | null
          org_id: string
          reconocimiento_medico_reforzado: boolean | null
          trabajador_extranjero_permiso: boolean | null
          ultima_revision_medica: string | null
          updated_at: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          es_extranjero?: boolean | null
          exonerado_seguro_medico?: boolean | null
          minusvalia?: boolean | null
          numero_seguridad_social?: string | null
          org_id: string
          reconocimiento_medico_reforzado?: boolean | null
          trabajador_extranjero_permiso?: boolean | null
          ultima_revision_medica?: string | null
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          es_extranjero?: boolean | null
          exonerado_seguro_medico?: boolean | null
          minusvalia?: boolean | null
          numero_seguridad_social?: string | null
          org_id?: string
          reconocimiento_medico_reforzado?: boolean | null
          trabajador_extranjero_permiso?: boolean | null
          ultima_revision_medica?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_health_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_health_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: true
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_health_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "employee_health_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_restrictions: {
        Row: {
          approved_by: string | null
          colaborador_id: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          reason: string | null
          restriction_type: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approved_by?: string | null
          colaborador_id: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          reason?: string | null
          restriction_type: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approved_by?: string | null
          colaborador_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          reason?: string | null
          restriction_type?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_restrictions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_restrictions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_restrictions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_restrictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "employee_restrictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role_canonical"]
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          org_id: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role_canonical"]
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role_canonical"]
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_departments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          department: string | null
          department_id: string | null
          hours: number | null
          id: string
          org_id: string | null
          rate_unit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          department_id?: string | null
          hours?: number | null
          id?: string
          org_id?: string | null
          rate_unit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          department_id?: string | null
          hours?: number | null
          id?: string
          org_id?: string | null
          rate_unit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "professional_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jobs_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "job_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_link_rate_limits: {
        Row: {
          created_at: string
          email: string
          email_count: number
          id: string
          ip: string
          ip_count: number
          last_request: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_count?: number
          id?: string
          ip: string
          ip_count?: number
          last_request?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_count?: number
          id?: string
          ip?: string
          ip_count?: number
          last_request?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          primary: boolean | null
          role: Database["public"]["Enums"]["app_role_canonical"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          primary?: boolean | null
          role: Database["public"]["Enums"]["app_role_canonical"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          primary?: boolean | null
          role?: Database["public"]["Enums"]["app_role_canonical"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          disabled_at: string | null
          disabled_by: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          notify_on_create: boolean
          notify_on_delete: boolean
          notify_on_update: boolean
          org_id: string
          shift_notifications_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          notify_on_create?: boolean
          notify_on_delete?: boolean
          notify_on_update?: boolean
          org_id: string
          shift_notifications_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          notify_on_create?: boolean
          notify_on_delete?: boolean
          notify_on_update?: boolean
          org_id?: string
          shift_notifications_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "notification_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancy_budgets: {
        Row: {
          absentismo_percentage: number | null
          ayudantes: number
          camareros: number
          created_at: string
          ett_external: number
          id: string
          jefe_bares: number
          jefe_sector: number
          occupancy_percentage: number
          org_id: string | null
          plantilla_absentismo: number | null
          plantilla_activa: number | null
          plantilla_bruta_total: number | null
          plantilla_librando: number | null
          plantilla_vacaciones: number | null
          presencial_total: number
          ratio_clients_barman: number | null
          segundo_jefe_bares: number
          total_clients: number
        }
        Insert: {
          absentismo_percentage?: number | null
          ayudantes?: number
          camareros?: number
          created_at?: string
          ett_external?: number
          id?: string
          jefe_bares?: number
          jefe_sector?: number
          occupancy_percentage: number
          org_id?: string | null
          plantilla_absentismo?: number | null
          plantilla_activa?: number | null
          plantilla_bruta_total?: number | null
          plantilla_librando?: number | null
          plantilla_vacaciones?: number | null
          presencial_total?: number
          ratio_clients_barman?: number | null
          segundo_jefe_bares?: number
          total_clients: number
        }
        Update: {
          absentismo_percentage?: number | null
          ayudantes?: number
          camareros?: number
          created_at?: string
          ett_external?: number
          id?: string
          jefe_bares?: number
          jefe_sector?: number
          occupancy_percentage?: number
          org_id?: string | null
          plantilla_absentismo?: number | null
          plantilla_activa?: number | null
          plantilla_bruta_total?: number | null
          plantilla_librando?: number | null
          plantilla_vacaciones?: number | null
          presencial_total?: number
          ratio_clients_barman?: number | null
          segundo_jefe_bares?: number
          total_clients?: number
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_budgets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "occupancy_budgets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_backups: {
        Row: {
          affected_records: number | null
          backup_data: Json
          created_at: string
          expires_at: string
          id: string
          operation_description: string | null
          operation_type: string
          org_id: string
          restored_at: string | null
          restored_by: string | null
          user_id: string
        }
        Insert: {
          affected_records?: number | null
          backup_data: Json
          created_at?: string
          expires_at?: string
          id?: string
          operation_description?: string | null
          operation_type: string
          org_id: string
          restored_at?: string | null
          restored_by?: string | null
          user_id: string
        }
        Update: {
          affected_records?: number | null
          backup_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          operation_description?: string | null
          operation_type?: string
          org_id?: string
          restored_at?: string | null
          restored_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          adquisicion_mensual: number | null
          base_calculo_vacaciones: string | null
          cif: string | null
          city: string | null
          codigo_naf: string | null
          contact_email: string | null
          convenio_colectivo: string | null
          country: string | null
          created_at: string | null
          establishment_address: string | null
          health_service_code: string | null
          id: string
          is_default_establishment: boolean | null
          is_franchise: boolean | null
          logo_url: string | null
          mutua: string | null
          name: string
          periodo_adquisicion_ano: string | null
          periodo_adquisicion_del: number | null
          periodo_adquisicion_mes: string | null
          phone: string | null
          postal_code: string | null
          subscription_status: string | null
          tipo_comida: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          adquisicion_mensual?: number | null
          base_calculo_vacaciones?: string | null
          cif?: string | null
          city?: string | null
          codigo_naf?: string | null
          contact_email?: string | null
          convenio_colectivo?: string | null
          country?: string | null
          created_at?: string | null
          establishment_address?: string | null
          health_service_code?: string | null
          id?: string
          is_default_establishment?: boolean | null
          is_franchise?: boolean | null
          logo_url?: string | null
          mutua?: string | null
          name: string
          periodo_adquisicion_ano?: string | null
          periodo_adquisicion_del?: number | null
          periodo_adquisicion_mes?: string | null
          phone?: string | null
          postal_code?: string | null
          subscription_status?: string | null
          tipo_comida?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          adquisicion_mensual?: number | null
          base_calculo_vacaciones?: string | null
          cif?: string | null
          city?: string | null
          codigo_naf?: string | null
          contact_email?: string | null
          convenio_colectivo?: string | null
          country?: string | null
          created_at?: string | null
          establishment_address?: string | null
          health_service_code?: string | null
          id?: string
          is_default_establishment?: boolean | null
          is_franchise?: boolean | null
          logo_url?: string | null
          mutua?: string | null
          name?: string
          periodo_adquisicion_ano?: string | null
          periodo_adquisicion_del?: number | null
          periodo_adquisicion_mes?: string | null
          phone?: string | null
          postal_code?: string | null
          subscription_status?: string | null
          tipo_comida?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      predefined_jobs: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string | null
          default_hours: number | null
          default_rate_unit: number | null
          description: string | null
          id: string
          job_title: string
          level_id: string | null
          level_name: string | null
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          default_hours?: number | null
          default_rate_unit?: number | null
          description?: string | null
          id?: string
          job_title: string
          level_id?: string | null
          level_name?: string | null
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          default_hours?: number | null
          default_rate_unit?: number | null
          description?: string | null
          id?: string
          job_title?: string
          level_id?: string | null
          level_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_predefined_jobs_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "professional_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_predefined_jobs_level"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "professional_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_categories: {
        Row: {
          agreement_id: string | null
          category_code: string | null
          category_name: string
          category_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          extracted_from: string | null
          id: string
          level_id: string | null
          org_id: string | null
          salary_level: number | null
        }
        Insert: {
          agreement_id?: string | null
          category_code?: string | null
          category_name: string
          category_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          extracted_from?: string | null
          id?: string
          level_id?: string | null
          org_id?: string | null
          salary_level?: number | null
        }
        Update: {
          agreement_id?: string | null
          category_code?: string | null
          category_name?: string
          category_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          extracted_from?: string | null
          id?: string
          level_id?: string | null
          org_id?: string | null
          salary_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_categories_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_categories_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "professional_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "professional_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_groups: {
        Row: {
          agreement_id: string
          created_at: string
          description: string | null
          group_code: string
          group_name: string
          id: string
          order_index: number
          org_id: string
          updated_at: string
        }
        Insert: {
          agreement_id: string
          created_at?: string
          description?: string | null
          group_code: string
          group_name: string
          id?: string
          order_index?: number
          org_id: string
          updated_at?: string
        }
        Update: {
          agreement_id?: string
          created_at?: string
          description?: string | null
          group_code?: string
          group_name?: string
          id?: string
          order_index?: number
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_groups_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_levels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          level_code: string | null
          level_name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level_code?: string | null
          level_name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level_code?: string | null
          level_name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          notified_at: string | null
          onboarding_completed: boolean | null
          primary_org_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          notified_at?: string | null
          onboarding_completed?: boolean | null
          primary_org_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          notified_at?: string | null
          onboarding_completed?: boolean | null
          primary_org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_org_id_fkey"
            columns: ["primary_org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "profiles_primary_org_id_fkey"
            columns: ["primary_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rgpd_settings: {
        Row: {
          consent_required: boolean | null
          cookie_consent: boolean | null
          created_at: string
          data_retention_years: number | null
          id: string
          privacy_policy: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_required?: boolean | null
          cookie_consent?: boolean | null
          created_at?: string
          data_retention_years?: number | null
          id?: string
          privacy_policy?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_required?: boolean | null
          cookie_consent?: boolean | null
          created_at?: string
          data_retention_years?: number | null
          id?: string
          privacy_policy?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_configurable: boolean | null
          is_enabled: boolean | null
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_configurable?: boolean | null
          is_enabled?: boolean | null
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          is_configurable?: boolean | null
          is_enabled?: boolean | null
          permission_name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["name"]
          },
        ]
      }
      rota_schedule_assignments: {
        Row: {
          assigned_by: string | null
          colaborador_id: string
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          org_id: string
          rota_id: string
          rota_shift_id: string | null
          start_time: string | null
          status_code: string | null
          updated_at: string | null
          work_date: string
        }
        Insert: {
          assigned_by?: string | null
          colaborador_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          org_id: string
          rota_id: string
          rota_shift_id?: string | null
          start_time?: string | null
          status_code?: string | null
          updated_at?: string | null
          work_date: string
        }
        Update: {
          assigned_by?: string | null
          colaborador_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          rota_id?: string
          rota_shift_id?: string | null
          start_time?: string | null
          status_code?: string | null
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_schedule_assignments_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedule_assignments_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedule_assignments_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_schedule_assignments_rota_shift_id_fkey"
            columns: ["rota_shift_id"]
            isOneToOne: false
            referencedRelation: "rota_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_shifts: {
        Row: {
          break_duration: number | null
          colaborador_id: string
          color: string | null
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          is_active: boolean | null
          notes: string | null
          org_id: string
          rota_id: string
          shift_name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          break_duration?: number | null
          colaborador_id: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id: string
          rota_id: string
          shift_name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          break_duration?: number | null
          colaborador_id?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id?: string
          rota_id?: string
          shift_name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rota_shifts_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_levels: {
        Row: {
          agreement_id: string
          base_salary: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          level_code: string
          level_name: string
          order_index: number
          org_id: string
          period: string
          professional_group_id: string
          updated_at: string
        }
        Insert: {
          agreement_id: string
          base_salary?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          level_code: string
          level_name: string
          order_index?: number
          org_id: string
          period?: string
          professional_group_id: string
          updated_at?: string
        }
        Update: {
          agreement_id?: string
          base_salary?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          level_code?: string
          level_name?: string
          order_index?: number
          org_id?: string
          period?: string
          professional_group_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_levels_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "collective_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_levels_professional_group_id_fkey"
            columns: ["professional_group_id"]
            isOneToOne: false
            referencedRelation: "professional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_shifts: {
        Row: {
          access_type: string
          break_duration: string | null
          break_type: string | null
          breaks: Json | null
          color: string
          created_at: string
          department: string | null
          end_time: string | null
          has_break: boolean | null
          id: string
          is_additional_time: boolean
          name: string
          notes: string | null
          org_id: string
          organization: string | null
          selected_team: string | null
          selected_workplace: string | null
          start_time: string | null
          total_break_time: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_type?: string
          break_duration?: string | null
          break_type?: string | null
          breaks?: Json | null
          color?: string
          created_at?: string
          department?: string | null
          end_time?: string | null
          has_break?: boolean | null
          id?: string
          is_additional_time?: boolean
          name: string
          notes?: string | null
          org_id: string
          organization?: string | null
          selected_team?: string | null
          selected_workplace?: string | null
          start_time?: string | null
          total_break_time?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_type?: string
          break_duration?: string | null
          break_type?: string | null
          breaks?: Json | null
          color?: string
          created_at?: string
          department?: string | null
          end_time?: string | null
          has_break?: boolean | null
          id?: string
          is_additional_time?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          organization?: string | null
          selected_team?: string | null
          selected_workplace?: string | null
          start_time?: string | null
          total_break_time?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "saved_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      status_codes: {
        Row: {
          code: string
          color: string | null
          description: string
        }
        Insert: {
          code: string
          color?: string | null
          description: string
        }
        Update: {
          code?: string
          color?: string | null
          description?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          colaborador_id: string
          id: string
          is_active: boolean
          team_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          colaborador_id: string
          id?: string
          is_active?: boolean
          team_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          colaborador_id?: string
          id?: string
          is_active?: boolean
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number | null
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      turnos_publicos: {
        Row: {
          created_at: string
          date_range_end: string
          date_range_start: string
          employee_count: number
          id: string
          is_current_version: boolean | null
          name: string
          org_id: string | null
          parent_turno_id: string | null
          published_at: string | null
          sent_emails: string[] | null
          shift_data: Json | null
          status: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          date_range_end: string
          date_range_start: string
          employee_count?: number
          id?: string
          is_current_version?: boolean | null
          name: string
          org_id?: string | null
          parent_turno_id?: string | null
          published_at?: string | null
          sent_emails?: string[] | null
          shift_data?: Json | null
          status?: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          employee_count?: number
          id?: string
          is_current_version?: boolean | null
          name?: string
          org_id?: string | null
          parent_turno_id?: string | null
          published_at?: string | null
          sent_emails?: string[] | null
          shift_data?: Json | null
          status?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_publicos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "turnos_publicos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_publicos_parent_turno_id_fkey"
            columns: ["parent_turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          colaborador_id: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_enabled: boolean
          org_id: string | null
          permission_name: string
          user_id: string
        }
        Insert: {
          colaborador_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled: boolean
          org_id?: string | null
          permission_name: string
          user_id: string
        }
        Update: {
          colaborador_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          org_id?: string | null
          permission_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaborador_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "user_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["name"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_canonical:
            | Database["public"]["Enums"]["app_role_canonical"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_canonical?:
            | Database["public"]["Enums"]["app_role_canonical"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_canonical?:
            | Database["public"]["Enums"]["app_role_canonical"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      colaborador_full: {
        Row: {
          apellidos: string | null
          apellidos_nacimiento: string | null
          apellidos_uso: string | null
          avatar_url: string | null
          banking_bic: string | null
          banking_iban: string | null
          banking_numero_identificacion: string | null
          banking_titular: string | null
          ciudad: string | null
          ciudad_nacimiento: string | null
          codigo_postal: string | null
          created_at: string | null
          direccion: string | null
          disponibilidad_semanal: Json | null
          email: string | null
          emergency_contact_apellidos: string | null
          emergency_contact_nombre: string | null
          emergency_contact_pais_fijo: string | null
          emergency_contact_pais_movil: string | null
          emergency_contact_relacion: string | null
          emergency_contact_telefono_fijo: string | null
          emergency_contact_telefono_movil: string | null
          empleado_id: string | null
          es_extranjero: boolean | null
          estado_civil: string | null
          exonerado_seguro_medico: boolean | null
          fecha_antiguedad: string | null
          fecha_fin_contrato: string | null
          fecha_inicio_contrato: string | null
          fecha_nacimiento: string | null
          genero: string | null
          has_generalized_access: boolean | null
          hora_inicio_contrato: string | null
          id: string | null
          job_id: string | null
          minusvalia: boolean | null
          nacionalidad: string | null
          nombre: string | null
          numero_personas_dependientes: number | null
          numero_seguridad_social: string | null
          org_id: string | null
          pais_fijo: string | null
          pais_movil: string | null
          pais_nacimiento: string | null
          pais_residencia: string | null
          provincia: string | null
          reconocimiento_medico_reforzado: boolean | null
          responsable_directo: string | null
          status: string | null
          telefono_fijo: string | null
          telefono_movil: string | null
          tiempo_trabajo_semanal: number | null
          tipo_contrato: string | null
          trabajador_extranjero_permiso: boolean | null
          ultima_revision_medica: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_usage_daily"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "colaboradores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_colaboradores_job"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_usage_daily: {
        Row: {
          active_users: number | null
          colaborador_actions: number | null
          date: string | null
          org_id: string | null
          org_name: string | null
          shift_actions: number | null
          total_actions: number | null
        }
        Relationships: []
      }
      user_roles_canonical: {
        Row: {
          role: string | null
          user_id: string | null
        }
        Insert: {
          role?: never
          user_id?: string | null
        }
        Update: {
          role?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_colaborador_to_team: {
        Args: {
          assigned_by_uuid?: string
          colaborador_uuid: string
          team_uuid: string
        }
        Returns: boolean
      }
      attach_memberships_for_current_user: {
        Args: never
        Returns: {
          became_primary: boolean
          org_id: string
          role: Database["public"]["Enums"]["app_role_canonical"]
        }[]
      }
      calculate_cuadrante_stats: {
        Args: { cuadrante_uuid: string; target_date: number }
        Returns: {
          banquetes_count: number
          enfermos_count: number
          faltas_count: number
          libres_count: number
          presencial_count: number
          total_plantilla: number
          vacaciones_count: number
        }[]
      }
      can_manage_calendars: { Args: { _user_id: string }; Returns: boolean }
      can_manage_colaborador_roles: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_backups: { Args: never; Returns: undefined }
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      cleanup_old_calendar_versions: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_colaborador_full_by_org: {
        Args: { org_uuid: string }
        Returns: {
          apellidos: string | null
          apellidos_nacimiento: string | null
          apellidos_uso: string | null
          avatar_url: string | null
          banking_bic: string | null
          banking_iban: string | null
          banking_numero_identificacion: string | null
          banking_titular: string | null
          ciudad: string | null
          ciudad_nacimiento: string | null
          codigo_postal: string | null
          created_at: string | null
          direccion: string | null
          disponibilidad_semanal: Json | null
          email: string | null
          emergency_contact_apellidos: string | null
          emergency_contact_nombre: string | null
          emergency_contact_pais_fijo: string | null
          emergency_contact_pais_movil: string | null
          emergency_contact_relacion: string | null
          emergency_contact_telefono_fijo: string | null
          emergency_contact_telefono_movil: string | null
          empleado_id: string | null
          es_extranjero: boolean | null
          estado_civil: string | null
          exonerado_seguro_medico: boolean | null
          fecha_antiguedad: string | null
          fecha_fin_contrato: string | null
          fecha_inicio_contrato: string | null
          fecha_nacimiento: string | null
          genero: string | null
          has_generalized_access: boolean | null
          hora_inicio_contrato: string | null
          id: string | null
          job_id: string | null
          minusvalia: boolean | null
          nacionalidad: string | null
          nombre: string | null
          numero_personas_dependientes: number | null
          numero_seguridad_social: string | null
          org_id: string | null
          pais_fijo: string | null
          pais_movil: string | null
          pais_nacimiento: string | null
          pais_residencia: string | null
          provincia: string | null
          reconocimiento_medico_reforzado: boolean | null
          responsable_directo: string | null
          status: string | null
          telefono_fijo: string | null
          telefono_movil: string | null
          tiempo_trabajo_semanal: number | null
          tipo_contrato: string | null
          trabajador_extranjero_permiso: boolean | null
          ultima_revision_medica: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "colaborador_full"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_colaborador_main_role: {
        Args: { colaborador_uuid: string }
        Returns: string
      }
      get_teams_by_org: {
        Args: { org_uuid: string }
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          member_count: number
          name: string
          order_index: number
        }[]
      }
      get_user_membership_role: {
        Args: { _org_id: string }
        Returns: Database["public"]["Enums"]["app_role_canonical"]
      }
      get_user_organizations: {
        Args: { _user_id?: string }
        Returns: {
          is_primary: boolean
          member_since: string
          org_id: string
          org_name: string
          user_role: Database["public"]["Enums"]["app_role_canonical"]
        }[]
      }
      get_user_permissions: {
        Args: { _colaborador_id?: string; _user_id: string }
        Returns: {
          category: string
          description: string
          is_configurable: boolean
          is_enabled: boolean
          permission_name: string
        }[]
      }
      get_user_primary_org: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_canonical: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role_canonical"]
      }
      get_user_role_in_org: {
        Args: { org_uuid: string; user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role_canonical"]
      }
      get_users_for_deletion_notification: {
        Args: never
        Returns: {
          deleted_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      get_users_for_hard_delete: {
        Args: never
        Returns: {
          deleted_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      handle_user_signup: {
        Args: {
          confirmation_url?: string
          user_email: string
          user_password: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_canonical: {
        Args: {
          _role: Database["public"]["Enums"]["app_role_canonical"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_extracted_categories: {
        Args: { p_agreement_id: string; p_categories: Json }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_canonical: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_name?: string
          _entity_type: string
          _establishment?: string
          _user_name: string
        }
        Returns: string
      }
      log_activity_with_org: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_name?: string
          _entity_type: string
          _org_id: string
          _user_name: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: {
          _accessed_data?: Json
          _action: string
          _record_id: string
          _table_name: string
        }
        Returns: undefined
      }
      mark_user_notified: { Args: { _user_id: string }; Returns: undefined }
      migrate_roles_to_canonical: { Args: never; Returns: undefined }
      reactivate_user: { Args: { _user_id: string }; Returns: boolean }
      remove_colaborador_from_team: {
        Args: { colaborador_uuid: string; team_uuid: string }
        Returns: boolean
      }
      set_primary_organization: { Args: { _org_id: string }; Returns: boolean }
      soft_delete_user: {
        Args: { _deleted_by: string; _reason?: string; _user_id: string }
        Returns: boolean
      }
      test_rls_access: {
        Args: never
        Returns: {
          details: string
          result: string
          test_name: string
        }[]
      }
      validate_consecutive_days_off: {
        Args: {
          cuadrante_uuid: string
          employee_uuid: string
          week_start: number
        }
        Returns: boolean
      }
      verify_phase2_migration: {
        Args: never
        Returns: {
          actual_count: number
          check_name: string
          expected_count: number
          status: string
        }[]
      }
      verify_phase3_migration: {
        Args: never
        Returns: {
          actual_count: number
          check_name: string
          details: string
          expected_count: number
          status: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "user"
        | "empleado"
        | "manager"
        | "director"
        | "administrador"
        | "propietario"
        | "jefe_departamento"
      app_role_canonical:
        | "OWNER"
        | "ADMIN"
        | "MANAGER"
        | "DIRECTOR"
        | "EMPLOYEE"
      hotel_role:
        | "propietario"
        | "administrador"
        | "director"
        | "manager"
        | "jefe_departamento"
        | "empleado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "user",
        "empleado",
        "manager",
        "director",
        "administrador",
        "propietario",
        "jefe_departamento",
      ],
      app_role_canonical: ["OWNER", "ADMIN", "MANAGER", "DIRECTOR", "EMPLOYEE"],
      hotel_role: [
        "propietario",
        "administrador",
        "director",
        "manager",
        "jefe_departamento",
        "empleado",
      ],
    },
  },
} as const
