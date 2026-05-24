// 파일명: src/types/database.types.ts

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
          role: string | null
          clan_point: number | null
          created_at: string
          race: string | null
          intro: string | null
          rookie_since: string | null
          by_id: string | null
          is_active: boolean | null
        }
        Insert: { /* 생략 (Row와 동일하되 id 제외 필수는 선택적) */ }
        Update: { /* 생략 */ }
      }
      applications: {
        Row: {
          id: number
          user_id: string | null
          discord_name: string | null
          btag: string | null
          race: string | null
          tier: string | null
          intro: string | null
          status: string | null
          created_at: string
          phone: string | null
          tester_id: string | null
          test_result: string | null
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          is_streamer: boolean | null
          streamer_platform: string | null
          streamer_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          review_note_summary: string | null
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['applications']['Row']>
      }
      admin_audit_logs: {
        Row: {
          id: number
          actor_id: string | null
          actor_by_id: string | null
          actor_role: string | null
          action_type: string
          target_table: string
          target_id: string | null
          before_data: Json | null
          after_data: Json | null
          note: string | null
          created_at: string
          is_test_data: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['admin_audit_logs']['Row'], 'id' | 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['admin_audit_logs']['Row']>
      }
      mmr_logs: {
        Row: {
          id: number
          created_at: string
          category: string
          action_type: string
          source_type: string
          is_manual: boolean
          actor_id: string | null
          actor_by_id: string | null
          actor_role: string | null
          target_user_id: string | null
          target_table: string | null
          target_id: string | null
          summary: string | null
          before_data: Json | null
          after_data: Json | null
          meta: Json | null
        }
        Insert: Omit<Database['public']['Tables']['mmr_logs']['Row'], 'id' | 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['mmr_logs']['Row']>
      }
    }
  }
}
