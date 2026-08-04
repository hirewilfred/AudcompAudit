export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          organization: string | null
          phone: string | null
          has_completed_audit: boolean
          last_audit_score: number | null
          directors_notes: string | null
          is_admin: boolean
          is_bdm: boolean
          assigned_expert_id: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          organization?: string | null
          phone?: string | null
          has_completed_audit?: boolean
          last_audit_score?: number | null
          directors_notes?: string | null
          is_admin?: boolean
          is_bdm?: boolean
          assigned_expert_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          organization?: string | null
          phone?: string | null
          has_completed_audit?: boolean
          last_audit_score?: number | null
          directors_notes?: string | null
          is_admin?: boolean
          is_bdm?: boolean
          assigned_expert_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      experts: {
        Row: {
          id: string
          full_name: string
          email: string | null
          linkedin_url: string | null
          bookings_url: string | null
          photo_url: string | null
          is_bdm: boolean | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          linkedin_url?: string | null
          bookings_url?: string | null
          photo_url?: string | null
          is_bdm?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          linkedin_url?: string | null
          bookings_url?: string | null
          photo_url?: string | null
          is_bdm?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          answer: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          answer: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          answer?: Json
          created_at?: string
        }
        Relationships: []
      }
      audit_scores: {
        Row: {
          id: string
          user_id: string
          overall_score: number
          category_scores: Json
          recommendations: string[]
          report_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          overall_score: number
          category_scores: Json
          recommendations: string[]
          report_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          overall_score?: number
          category_scores?: Json
          recommendations?: string[]
          report_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ai_advisor_reports: {
        Row: {
          id: string
          user_id: string
          organization: string | null
          responses: Json
          recommendations: Json | null
          roadmap: Json | null
          narrative: string | null
          roi_parameters: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization?: string | null
          responses: Json
          recommendations?: Json | null
          roadmap?: Json | null
          narrative?: string | null
          roi_parameters?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization?: string | null
          responses?: Json
          recommendations?: Json | null
          roadmap?: Json | null
          narrative?: string | null
          roi_parameters?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cw_locations: {
        Row: {
          id: number
          name: string
          raw: Json | null
          synced_at: string
        }
        Insert: {
          id: number
          name: string
          raw?: Json | null
          synced_at?: string
        }
        Update: {
          id?: number
          name?: string
          raw?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      cw_departments: {
        Row: {
          id: number
          name: string
          location_id: number | null
          raw: Json | null
          synced_at: string
        }
        Insert: {
          id: number
          name: string
          location_id?: number | null
          raw?: Json | null
          synced_at?: string
        }
        Update: {
          id?: number
          name?: string
          location_id?: number | null
          raw?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      cw_monitored_boards: {
        Row: {
          board_id: number
          board_name: string
          location_id: number | null
          location_name: string | null
          department_id: number | null
          department_name: string | null
          monitor_today: boolean
          monitor_pending_closure: boolean
          monitor_sla: boolean
          enabled: boolean
          raw: Json | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          board_id: number
          board_name: string
          location_id?: number | null
          location_name?: string | null
          department_id?: number | null
          department_name?: string | null
          monitor_today?: boolean
          monitor_pending_closure?: boolean
          monitor_sla?: boolean
          enabled?: boolean
          raw?: Json | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          board_id?: number
          board_name?: string
          location_id?: number | null
          location_name?: string | null
          department_id?: number | null
          department_name?: string | null
          monitor_today?: boolean
          monitor_pending_closure?: boolean
          monitor_sla?: boolean
          enabled?: boolean
          raw?: Json | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cw_board_preferences: {
        Row: {
          id: string
          user_id: string | null
          name: string
          location_ids: number[]
          department_ids: number[]
          board_ids: number[]
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          location_ids?: number[]
          department_ids?: number[]
          board_ids?: number[]
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          location_ids?: number[]
          department_ids?: number[]
          board_ids?: number[]
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cw_tickets: {
        Row: {
          id: number
          summary: string | null
          status_name: string | null
          status_id: number | null
          board_id: number | null
          board_name: string | null
          priority_id: number | null
          priority_name: string | null
          priority_sort: number | null
          company_id: number | null
          company_name: string | null
          contact_id: number | null
          contact_name: string | null
          resources: string | null
          assigned_resource: string | null
          date_entered: string | null
          date_closed: string | null
          last_updated: string | null
          required_date: string | null
          date_next_action: string | null
          actual_hours: number | null
          age_days: number | null
          sla_status: string | null
          sla_respond_minutes: number | null
          sla_resolve_minutes: number | null
          sla_resolution_minutes: number | null
          minutes_until_breach: number | null
          raw: Json | null
          synced_at: string
        }
        Insert: {
          id: number
          summary?: string | null
          status_name?: string | null
          status_id?: number | null
          board_id?: number | null
          board_name?: string | null
          priority_id?: number | null
          priority_name?: string | null
          priority_sort?: number | null
          company_id?: number | null
          company_name?: string | null
          contact_id?: number | null
          contact_name?: string | null
          resources?: string | null
          assigned_resource?: string | null
          date_entered?: string | null
          date_closed?: string | null
          last_updated?: string | null
          required_date?: string | null
          date_next_action?: string | null
          actual_hours?: number | null
          age_days?: number | null
          sla_status?: string | null
          sla_respond_minutes?: number | null
          sla_resolve_minutes?: number | null
          sla_resolution_minutes?: number | null
          minutes_until_breach?: number | null
          raw?: Json | null
          synced_at?: string
        }
        Update: {
          id?: number
          summary?: string | null
          status_name?: string | null
          status_id?: number | null
          board_id?: number | null
          board_name?: string | null
          priority_id?: number | null
          priority_name?: string | null
          priority_sort?: number | null
          company_id?: number | null
          company_name?: string | null
          contact_id?: number | null
          contact_name?: string | null
          resources?: string | null
          assigned_resource?: string | null
          date_entered?: string | null
          date_closed?: string | null
          last_updated?: string | null
          required_date?: string | null
          date_next_action?: string | null
          actual_hours?: number | null
          age_days?: number | null
          sla_status?: string | null
          sla_respond_minutes?: number | null
          sla_resolve_minutes?: number | null
          sla_resolution_minutes?: number | null
          minutes_until_breach?: number | null
          raw?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      cw_sync_runs: {
        Row: {
          id: string
          scope: string
          started_at: string
          finished_at: string | null
          record_count: number | null
          success: boolean | null
          error_message: string | null
          meta: Json | null
        }
        Insert: {
          id?: string
          scope: string
          started_at?: string
          finished_at?: string | null
          record_count?: number | null
          success?: boolean | null
          error_message?: string | null
          meta?: Json | null
        }
        Update: {
          id?: string
          scope?: string
          started_at?: string
          finished_at?: string | null
          record_count?: number | null
          success?: boolean | null
          error_message?: string | null
          meta?: Json | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
