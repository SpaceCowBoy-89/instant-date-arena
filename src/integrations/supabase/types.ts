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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          notes: string | null
          requested_at: string
          scheduled_deletion_at: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          requested_at?: string
          scheduled_deletion_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          requested_at?: string
          scheduled_deletion_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      arena_leaderboard: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          last_active: string | null
          rank_position: number | null
          total_points: number
          total_responses: number
          total_sessions: number
          total_votes_received: number
          updated_at: string
          user_id: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          last_active?: string | null
          rank_position?: number | null
          total_points?: number
          total_responses?: number
          total_sessions?: number
          total_votes_received?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          last_active?: string | null
          rank_position?: number | null
          total_points?: number
          total_responses?: number
          total_sessions?: number
          total_votes_received?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arena_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_arena_participants_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "arena_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          response_type: string | null
          session_id: string
          submitted_at: string
          user_id: string
          video_duration: number | null
          video_thumbnail: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          response_type?: string | null
          session_id: string
          submitted_at?: string
          user_id: string
          video_duration?: number | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          response_type?: string | null
          session_id?: string
          submitted_at?: string
          user_id?: string
          video_duration?: number | null
          video_thumbnail?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_arena_responses_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "arena_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_sessions: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          prompt: string | null
          session_end: string
          session_start: string
          status: string
          updated_at: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          prompt?: string | null
          session_end: string
          session_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          prompt?: string | null
          session_end?: string
          session_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      arena_votes: {
        Row: {
          created_at: string
          id: string
          response_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          response_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_arena_votes_response"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "arena_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          chat_id: string
          created_at: string
          ended_at: string | null
          ended_by: string | null
          messages: Json | null
          status: Database["public"]["Enums"]["chat_status"]
          temporary_messages: Json | null
          timer_start_time: string | null
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          chat_id?: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          messages?: Json | null
          status?: Database["public"]["Enums"]["chat_status"]
          temporary_messages?: Json | null
          timer_start_time?: string | null
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          messages?: Json | null
          status?: Database["public"]["Enums"]["chat_status"]
          temporary_messages?: Json | null
          timer_start_time?: string | null
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          event_date: string
          group_id: string
          id: string
          location: string | null
          max_attendees: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          event_date: string
          group_id: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          event_date?: string
          group_id?: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compatibility_questions: {
        Row: {
          created_at: string
          id: string
          question_text: string
          trait_category: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_text: string
          trait_category: string
        }
        Update: {
          created_at?: string
          id?: string
          question_text?: string
          trait_category?: string
        }
        Relationships: []
      }
      connections_group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "connections_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      connections_groups: {
        Row: {
          created_at: string
          id: string
          tag_name: string
          tag_subtitle: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_name: string
          tag_subtitle: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_name?: string
          tag_subtitle?: string
        }
        Relationships: []
      }
      connections_questions: {
        Row: {
          answers: Json
          created_at: string
          id: string
          question: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          question: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          question?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      match_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          sent_at: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sent_at?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sent_at?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue: {
        Row: {
          created_at: string
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action_type: string
          count?: number
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action_type?: string
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_compatibility_answers: {
        Row: {
          answer_value: number
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_value: number
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer_value?: number
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_compatibility_matches: {
        Row: {
          age_diff: number | null
          agreeableness_diff: number | null
          compatibility_label: number | null
          compatibility_score: number | null
          conscientiousness_diff: number | null
          created_at: string
          directness_diff: number | null
          extroversion_diff: number | null
          id: string
          neuroticism_diff: number | null
          openness_to_experience_diff: number | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          age_diff?: number | null
          agreeableness_diff?: number | null
          compatibility_label?: number | null
          compatibility_score?: number | null
          conscientiousness_diff?: number | null
          created_at?: string
          directness_diff?: number | null
          extroversion_diff?: number | null
          id?: string
          neuroticism_diff?: number | null
          openness_to_experience_diff?: number | null
          user1_id: string
          user2_id: string
        }
        Update: {
          age_diff?: number | null
          agreeableness_diff?: number | null
          compatibility_label?: number | null
          compatibility_score?: number | null
          conscientiousness_diff?: number | null
          created_at?: string
          directness_diff?: number | null
          extroversion_diff?: number | null
          id?: string
          neuroticism_diff?: number | null
          openness_to_experience_diff?: number | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      user_compatibility_scores: {
        Row: {
          agreeableness_score: number | null
          communication_style_score: number | null
          conscientiousness_score: number | null
          created_at: string
          directness_score: number | null
          emotional_intelligence_score: number | null
          extroversion_score: number | null
          flexibility_score: number | null
          id: string
          neuroticism_score: number | null
          openness_to_experience_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreeableness_score?: number | null
          communication_style_score?: number | null
          conscientiousness_score?: number | null
          created_at?: string
          directness_score?: number | null
          emotional_intelligence_score?: number | null
          extroversion_score?: number | null
          flexibility_score?: number | null
          id?: string
          neuroticism_score?: number | null
          openness_to_experience_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreeableness_score?: number | null
          communication_style_score?: number | null
          conscientiousness_score?: number | null
          created_at?: string
          directness_score?: number | null
          emotional_intelligence_score?: number | null
          extroversion_score?: number | null
          flexibility_score?: number | null
          id?: string
          neuroticism_score?: number | null
          openness_to_experience_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_compatibility_scores_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          selected_answer: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          selected_answer: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          selected_answer?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "connections_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections_groups: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "connections_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_match_limits: {
        Row: {
          created_at: string
          daily_limit: number
          date: string
          id: string
          matches_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          date?: string
          id?: string
          matches_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          date?: string
          id?: string
          matches_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          chat_id: string | null
          created_at: string
          description: string | null
          id: string
          message_id: string | null
          report_type: string
          reported_user_id: string
          reporter_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          report_type: string
          reported_user_id: string
          reporter_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_id?: string | null
          report_type?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "user_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "connections_group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string
          updated_at: string
          user_id: string
          verification_data: Json | null
          verification_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
          verification_data?: Json | null
          verification_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verification_data?: Json | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string | null
          age: number | null
          bio: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_at: string | null
          gender: string | null
          id: string
          interests: Json | null
          location: string | null
          name: string
          photo_url: string | null
          photos: Json | null
          pinned_chats: Json | null
          preferences: Json | null
          reports_count: number | null
          updated_at: string
          verification_approved_at: string | null
          verification_method: string | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          account_status?: string | null
          age?: number | null
          bio?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_at?: string | null
          gender?: string | null
          id: string
          interests?: Json | null
          location?: string | null
          name: string
          photo_url?: string | null
          photos?: Json | null
          pinned_chats?: Json | null
          preferences?: Json | null
          reports_count?: number | null
          updated_at?: string
          verification_approved_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          account_status?: string | null
          age?: number | null
          bio?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_at?: string | null
          gender?: string | null
          id?: string
          interests?: Json | null
          location?: string | null
          name?: string
          photo_url?: string | null
          photos?: Json | null
          pinned_chats?: Json | null
          preferences?: Json | null
          reports_count?: number | null
          updated_at?: string
          verification_approved_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_message: {
        Args: { chat_id_param: string; message_param: Json }
        Returns: undefined
      }
      calculate_compatibility_scores: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calculate_user_compatibility: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: Json
      }
      can_view_compatibility_scores: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_user_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_and_increment_match_usage: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      create_test_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      detect_suspicious_activity: {
        Args: { p_user_id: string }
        Returns: Json
      }
      handle_user_interaction: {
        Args: {
          p_chat_id: string
          p_interaction_type: string
          p_target_user_id: string
          p_user_id: string
        }
        Returns: Json
      }
      request_account_deletion: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      chat_status:
        | "active"
        | "ended_by_departure"
        | "ended_manually"
        | "completed"
      queue_status: "waiting" | "matched" | "active"
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
      chat_status: [
        "active",
        "ended_by_departure",
        "ended_manually",
        "completed",
      ],
      queue_status: ["waiting", "matched", "active"],
    },
  },
} as const
