// 파일명: src/types/supabase.ts

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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          actor_by_id: string | null
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          category: string | null
          created_at: string
          id: number
          ip_address: string | null
          is_test_data: boolean | null
          note: string | null
          severity: string | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action_type: string
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string | null
          created_at?: string
          id?: never
          ip_address?: string | null
          is_test_data?: boolean | null
          note?: string | null
          severity?: string | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action_type?: string
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string | null
          created_at?: string
          id?: never
          ip_address?: string | null
          is_test_data?: boolean | null
          note?: string | null
          severity?: string | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          discord_name: string | null
          id: number
          intro: string | null
          is_streamer: boolean | null
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          motivation: string | null
          phone: string | null
          playtime: string | null
          race: string | null
          review_note_summary: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          streamer_platform: string | null
          streamer_url: string | null
          test_result: string | null
          tester_id: string | null
          tier: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discord_name?: string | null
          id?: number
          intro?: string | null
          is_streamer?: boolean | null
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          motivation?: string | null
          phone?: string | null
          playtime?: string | null
          race?: string | null
          review_note_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          streamer_platform?: string | null
          streamer_url?: string | null
          test_result?: string | null
          tester_id?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discord_name?: string | null
          id?: number
          intro?: string | null
          is_streamer?: boolean | null
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          motivation?: string | null
          phone?: string | null
          playtime?: string | null
          race?: string | null
          review_note_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          streamer_platform?: string | null
          streamer_url?: string | null
          test_result?: string | null
          tester_id?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_applications_tester_id"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_applications_tester_id"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clanpoint_logs: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string
          id: number
          is_test_data: boolean | null
          reason: string | null
          related_id: string | null
          source_id: string | null
          source_type: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string
          id?: number
          is_test_data?: boolean | null
          reason?: string | null
          related_id?: string | null
          source_id?: string | null
          source_type?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string
          id?: number
          is_test_data?: boolean | null
          reason?: string | null
          related_id?: string | null
          source_id?: string | null
          source_type?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "point_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          post_id: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          post_id?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          post_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value_bool: boolean | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value_bool?: boolean | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value_bool?: boolean | null
        }
        Relationships: []
      }
      ladder_match_sets: {
        Row: {
          claim_time: string | null
          claimed_winner: string | null
          combo_code: string | null
          created_at: string | null
          id: string
          is_test_data: boolean | null
          match_id: string | null
          match_type: string | null
          race_cards: string[] | null
          set_mmr_applied: boolean
          set_number: number | null
          started_at: string | null
          status: string | null
          team_a_entry: Json | null
          team_a_ready: boolean | null
          team_a_rest_ids: string[] | null
          team_a_withdraw_req: boolean | null
          team_b_entry: Json | null
          team_b_ready: boolean | null
          team_b_rest_ids: string[] | null
          team_b_withdraw_req: boolean | null
          winner_team: string | null
        }
        Insert: {
          claim_time?: string | null
          claimed_winner?: string | null
          combo_code?: string | null
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          match_id?: string | null
          match_type?: string | null
          race_cards?: string[] | null
          set_mmr_applied?: boolean
          set_number?: number | null
          started_at?: string | null
          status?: string | null
          team_a_entry?: Json | null
          team_a_ready?: boolean | null
          team_a_rest_ids?: string[] | null
          team_a_withdraw_req?: boolean | null
          team_b_entry?: Json | null
          team_b_ready?: boolean | null
          team_b_rest_ids?: string[] | null
          team_b_withdraw_req?: boolean | null
          winner_team?: string | null
        }
        Update: {
          claim_time?: string | null
          claimed_winner?: string | null
          combo_code?: string | null
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          match_id?: string | null
          match_type?: string | null
          race_cards?: string[] | null
          set_mmr_applied?: boolean
          set_number?: number | null
          started_at?: string | null
          status?: string | null
          team_a_entry?: Json | null
          team_a_ready?: boolean | null
          team_a_rest_ids?: string[] | null
          team_a_withdraw_req?: boolean | null
          team_b_entry?: Json | null
          team_b_ready?: boolean | null
          team_b_rest_ids?: string[] | null
          team_b_withdraw_req?: boolean | null
          winner_team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_match_sets_parent"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "ladder_record"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_queue: {
        Row: {
          is_in_queue: boolean
          queue_joined_at: string | null
          user_id: string
          vote_to_start: boolean
        }
        Insert: {
          is_in_queue?: boolean
          queue_joined_at?: string | null
          user_id: string
          vote_to_start?: boolean
        }
        Update: {
          is_in_queue?: boolean
          queue_joined_at?: string | null
          user_id?: string
          vote_to_start?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ladder_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ladder_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_rankings: {
        Row: {
          favorite_race: string | null
          id: string
          losses: number | null
          personal_mmr: number | null
          race_combo_stats: Json | null
          recent_total_delta: number
          team_mmr: number
          tier: string | null
          total_mmr: number | null
          updated_at: string | null
          user_id: string | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          favorite_race?: string | null
          id?: string
          losses?: number | null
          personal_mmr?: number | null
          race_combo_stats?: Json | null
          recent_total_delta?: number
          team_mmr?: number
          tier?: string | null
          total_mmr?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          favorite_race?: string | null
          id?: string
          losses?: number | null
          personal_mmr?: number | null
          race_combo_stats?: Json | null
          recent_total_delta?: number
          team_mmr?: number
          tier?: string | null
          total_mmr?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ladder_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ladder_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_record: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          match_type: string
          score_a: number | null
          score_b: number | null
          status: string | null
          team_a_ids: string[] | null
          team_a_races: string[] | null
          team_b_ids: string[] | null
          team_b_races: string[] | null
          winner_team: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          match_type: string
          score_a?: number | null
          score_b?: number | null
          status?: string | null
          team_a_ids?: string[] | null
          team_a_races?: string[] | null
          team_b_ids?: string[] | null
          team_b_races?: string[] | null
          winner_team?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          match_type?: string
          score_a?: number | null
          score_b?: number | null
          status?: string | null
          team_a_ids?: string[] | null
          team_a_races?: string[] | null
          team_b_ids?: string[] | null
          team_b_races?: string[] | null
          winner_team?: string | null
        }
        Relationships: []
      }
      ladder_settlement: {
        Row: {
          created_at: string | null
          id: string
          is_winner: boolean
          match_id: string
          mmr_change: number
          team: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_winner: boolean
          match_id: string
          mmr_change?: number
          team: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_winner?: boolean
          match_id?: string
          mmr_change?: number
          team?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_settlement_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "ladder_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_settlement_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_settlement_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_bets: {
        Row: {
          bet_amount: number | null
          created_at: string | null
          id: string
          match_id: string | null
          odds: number | null
          payout: number | null
          settled_at: string | null
          status: string | null
          team_choice: string | null
          user_id: string | null
        }
        Insert: {
          bet_amount?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          odds?: number | null
          payout?: number | null
          settled_at?: string | null
          status?: string | null
          team_choice?: string | null
          user_id?: string | null
        }
        Update: {
          bet_amount?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          odds?: number | null
          payout?: number | null
          settled_at?: string | null
          status?: string | null
          team_choice?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "match_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mmr_logs: {
        Row: {
          action_type: string
          actor_by_id: string | null
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          category: string
          created_at: string
          id: number
          is_manual: boolean
          meta: Json | null
          source_type: string
          summary: string | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category: string
          created_at?: string
          id?: never
          is_manual?: boolean
          meta?: Json | null
          source_type?: string
          summary?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string
          created_at?: string
          id?: never
          is_manual?: boolean
          meta?: Json | null
          source_type?: string
          summary?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notice_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notice_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          link_to: string | null
          message: string
          metadata: Json
          read_at: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          link_to?: string | null
          message: string
          metadata?: Json
          read_at?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          link_to?: string | null
          message?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          id: string
          post_id: number | null
          user_id: string | null
          vote_type: string | null
        }
        Insert: {
          id?: string
          post_id?: number | null
          user_id?: string | null
          vote_type?: string | null
        }
        Update: {
          id?: string
          post_id?: number | null
          user_id?: string | null
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachment_urls: Json | null
          category: string | null
          content: string | null
          created_at: string
          dislikes: number | null
          id: number
          is_test_data: boolean | null
          is_test_data_active: boolean | null
          likes: number | null
          link_url: string | null
          title: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          attachment_urls?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string
          dislikes?: number | null
          id?: number
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          likes?: number | null
          link_url?: string | null
          title?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          attachment_urls?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string
          dislikes?: number | null
          id?: number
          is_test_data?: boolean | null
          is_test_data_active?: boolean | null
          likes?: number | null
          link_url?: string | null
          title?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_meta: {
        Row: {
          is_streamer: boolean
          is_test_account: boolean
          is_test_account_active: boolean
          last_daily_bonus_at: string | null
          last_discord_checkin_at: string | null
          last_login_at: string | null
          streamer_platform: string | null
          streamer_url: string | null
          user_id: string
        }
        Insert: {
          is_streamer?: boolean
          is_test_account?: boolean
          is_test_account_active?: boolean
          last_daily_bonus_at?: string | null
          last_discord_checkin_at?: string | null
          last_login_at?: string | null
          streamer_platform?: string | null
          streamer_url?: string | null
          user_id: string
        }
        Update: {
          is_streamer?: boolean
          is_test_account?: boolean
          is_test_account_active?: boolean
          last_daily_bonus_at?: string | null
          last_discord_checkin_at?: string | null
          last_login_at?: string | null
          streamer_platform?: string | null
          streamer_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_meta_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_meta_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_oauth: {
        Row: {
          auth_provider: string | null
          discord_id: string | null
          google_avatar_url: string | null
          google_email: string | null
          google_name: string | null
          google_sub: string | null
          user_id: string
        }
        Insert: {
          auth_provider?: string | null
          discord_id?: string | null
          google_avatar_url?: string | null
          google_email?: string | null
          google_name?: string | null
          google_sub?: string | null
          user_id: string
        }
        Update: {
          auth_provider?: string | null
          discord_id?: string | null
          google_avatar_url?: string | null
          google_email?: string | null
          google_name?: string | null
          google_sub?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_oauth_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_oauth_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_id: string | null
          by_id: string | null
          clan_point: number | null
          created_at: string
          intro: string | null
          is_active: boolean | null
          race: string | null
          role: string | null
          rookie_since: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          by_id?: string | null
          clan_point?: number | null
          created_at?: string
          intro?: string | null
          is_active?: boolean | null
          race?: string | null
          role?: string | null
          rookie_since?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          by_id?: string | null
          clan_point?: number | null
          created_at?: string
          intro?: string | null
          is_active?: boolean | null
          race?: string | null
          role?: string | null
          rookie_since?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_manual_activity_review: {
        Row: {
          action_type: string | null
          actor_by_id: string | null
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          category: string | null
          created_at: string | null
          id: number | null
          meta: Json | null
          summary: string | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type?: string | null
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string | null
          created_at?: string | null
          id?: number | null
          meta?: Json | null
          summary?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string | null
          actor_by_id?: string | null
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          category?: string | null
          created_at?: string | null
          id?: number | null
          meta?: Json | null
          summary?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_profiles: {
        Row: {
          auth_provider: string | null
          by_id: string | null
          clan_point: number | null
          created_at: string | null
          discord_id: string | null
          google_avatar_url: string | null
          google_email: string | null
          google_name: string | null
          google_sub: string | null
          id: string | null
          intro: string | null
          is_in_queue: boolean | null
          is_streamer: boolean | null
          is_test_account: boolean | null
          is_test_account_active: boolean | null
          ladder_mmr: number | null
          last_daily_bonus_at: string | null
          last_discord_checkin_at: string | null
          last_login_at: string | null
          losses: number | null
          queue_joined_at: string | null
          race: string | null
          race_combo_stats: Json | null
          recent_total_delta: number | null
          role: string | null
          rookie_since: string | null
          streamer_platform: string | null
          streamer_url: string | null
          team_mmr: number | null
          total_mmr: number | null
          vote_to_start: boolean | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_claim_set_win: {
        Args: { p_set_id: string; p_winner_team: string }
        Returns: undefined
      }
      fn_declare_set_winner: {
        Args: {
          p_match_id: string
          p_next_combo_id: string
          p_set_id: string
          p_winner_team: string
        }
        Returns: undefined
      }
      fn_empty_race_combo_stats: { Args: never; Returns: Json }
      fn_entry_player_ids: { Args: { p_entry: Json }; Returns: string[] }
      fn_get_match_bet_odds: {
        Args: { p_match_id: string }
        Returns: {
          count_a: number
          count_b: number
          match_id: string
          odds_a: number
          odds_b: number
          total_a: number
          total_b: number
          total_pool: number
        }[]
      }
      fn_get_race_combo_code: { Args: { p_races: string[] }; Returns: string }
      fn_has_any_role: { Args: { allowed_roles: string[] }; Returns: boolean }
      fn_increment_combo_stat: {
        Args: { p_combo: string; p_key: string; p_stats: Json }
        Returns: Json
      }
      fn_is_admin: { Args: never; Returns: boolean }
      fn_is_developer: { Args: never; Returns: boolean }
      fn_is_master: { Args: never; Returns: boolean }
      fn_is_match_live_mode_enabled: { Args: never; Returns: boolean }
      fn_is_member:
      | { Args: never; Returns: boolean }
      | { Args: { p_role: string }; Returns: boolean }
      fn_is_reviewer: { Args: never; Returns: boolean }
      fn_is_rookie: { Args: never; Returns: boolean }
      fn_merge_user_account: {
        Args: { p_admin_uuid: string; p_new_uuid: string; p_old_uuid: string }
        Returns: undefined
      }
      fn_place_bet: {
        Args: {
          p_bet_amount: number
          p_match_id: string
          p_team_choice: string
          p_user_id: string
        }
        Returns: undefined
      }
      fn_veto_set_win: { Args: { p_set_id: string }; Returns: undefined }
      increment_views: { Args: { row_id: number }; Returns: undefined }
      rpc_update_profile_role: {
        Args: { p_new_role: string; p_note?: string; p_target_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
