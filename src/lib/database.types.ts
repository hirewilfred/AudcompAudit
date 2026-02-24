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
          has_completed_audit: boolean
          last_audit_score: number | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          organization?: string | null
          has_completed_audit?: boolean
          last_audit_score?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          organization?: string | null
          has_completed_audit?: boolean
          last_audit_score?: number | null
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
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          overall_score: number
          category_scores: Json
          recommendations: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          overall_score?: number
          category_scores?: Json
          recommendations?: string[]
          created_at?: string
        }
      }
    }
  }
}
