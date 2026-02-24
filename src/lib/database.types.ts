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
          updated_at?: string | null
        }
      }
      experts: {
        Row: {
          id: string
          full_name: string
          email: string | null
          linkedin_url: string | null
          bookings_url: string | null
          photo_url: string | null
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
          created_at?: string
          updated_at?: string | null
        }
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
      }
    }
  }
}
