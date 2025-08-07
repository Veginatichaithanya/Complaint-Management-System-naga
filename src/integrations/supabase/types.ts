export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          admin_id: string
          created_at: string | null
          email: string
          full_name: string
        }
        Insert: {
          admin_id?: string
          created_at?: string | null
          email: string
          full_name: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          complaint_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          message: string
          sender_type: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          message: string
          sender_type: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_type?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          ai_resolved: boolean | null
          attachment: string | null
          category: string
          complaint_id: string
          created_at: string | null
          description: string
          priority: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_resolved?: boolean | null
          attachment?: string | null
          category: string
          complaint_id?: string
          created_at?: string | null
          description: string
          priority: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_resolved?: boolean | null
          attachment?: string | null
          category?: string
          complaint_id?: string
          created_at?: string | null
          description?: string
          priority?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feedback: {
        Row: {
          comments: string | null
          complaint_id: string | null
          feedback_id: string
          feedback_type: string | null
          rating: number | null
          request_id: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          comments?: string | null
          complaint_id?: string | null
          feedback_id?: string
          feedback_type?: string | null
          rating?: number | null
          request_id?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments?: string | null
          complaint_id?: string | null
          feedback_id?: string
          feedback_type?: string | null
          rating?: number | null
          request_id?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "admin_complaints_with_users"
            referencedColumns: ["complaint_id"]
          },
          {
            foreignKeyName: "feedback_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["complaint_id"]
          },
          {
            foreignKeyName: "feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          request_type: string
          status: string
          target_user_email: string
          target_user_id: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          request_type?: string
          status?: string
          target_user_email: string
          target_user_id?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          request_type?: string
          status?: string
          target_user_email?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ibm_complaints: {
        Row: {
          attachment_url: string | null
          category: string
          complaint_id: number
          department: string
          description: string
          email: string
          employee_id: string
          full_name: string
          issue_title: string
          priority: string
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          category: string
          complaint_id?: number
          department: string
          description: string
          email: string
          employee_id: string
          full_name: string
          issue_title: string
          priority: string
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          category?: string
          complaint_id?: number
          department?: string
          description?: string
          email?: string
          employee_id?: string
          full_name?: string
          issue_title?: string
          priority?: string
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_attendees: {
        Row: {
          attendance_status: string | null
          complaint_id: string | null
          id: string
          invitation_status: string
          invited_at: string
          meeting_id: string
          responded_at: string | null
          user_id: string
        }
        Insert: {
          attendance_status?: string | null
          complaint_id?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string
          meeting_id: string
          responded_at?: string | null
          user_id: string
        }
        Update: {
          attendance_status?: string | null
          complaint_id?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string
          meeting_id?: string
          responded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          admin_id: string | null
          complaint_id: string | null
          created_at: string | null
          description: string | null
          invited_user_id: string | null
          meet_link: string
          meeting_id: string
          schedule_time: string
          status: string | null
          title: string | null
        }
        Insert: {
          admin_id?: string | null
          complaint_id?: string | null
          created_at?: string | null
          description?: string | null
          invited_user_id?: string | null
          meet_link: string
          meeting_id?: string
          schedule_time: string
          status?: string | null
          title?: string | null
        }
        Update: {
          admin_id?: string | null
          complaint_id?: string | null
          created_at?: string | null
          description?: string | null
          invited_user_id?: string | null
          meet_link?: string
          meeting_id?: string
          schedule_time?: string
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meetings_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "admin_complaints_with_users"
            referencedColumns: ["complaint_id"]
          },
          {
            foreignKeyName: "meetings_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["complaint_id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          recipient: string
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient: string
          status?: string
          subject?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient?: string
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          complaint_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          ticket_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          ticket_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          ticket_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role_type: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role_type?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          complaint_id: string
          created_at: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          page_url: string | null
          session_id: string | null
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          login_time: string | null
          logout_time: string | null
          session_duration: number | null
          session_token: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          login_time?: string | null
          logout_time?: string | null
          session_duration?: number | null
          session_token?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          login_time?: string | null
          logout_time?: string | null
          session_duration?: number | null
          session_token?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          employee_id: string
          full_name: string
          total_complaints: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_id: string
          full_name: string
          total_complaints?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_id?: string
          full_name?: string
          total_complaints?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_complaints_with_users: {
        Row: {
          ai_resolved: boolean | null
          attachment: string | null
          category: string | null
          complaint_id: string | null
          created_at: string | null
          description: string | null
          priority: string | null
          profile_full_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_department: string | null
          user_email: string | null
          user_employee_id: string | null
          user_full_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      accept_complaint: {
        Args: { complaint_id_param: string; admin_user_id?: string }
        Returns: boolean
      }
      check_user_active_session: {
        Args: { user_email: string }
        Returns: {
          user_exists: boolean
          is_signed_in: boolean
          user_id: string
          user_name: string
          employee_id: string
        }[]
      }
      check_user_email_verification: {
        Args: { target_email: string }
        Returns: Json
      }
      delete_complaint_permanently: {
        Args: { complaint_id_param: string; admin_user_id: string }
        Returns: boolean
      }
      ensure_admin_permissions: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pending_complaints_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_similar_complaints: {
        Args: { hours_limit?: number; min_similar_count?: number }
        Returns: {
          issue_keywords: string
          complaint_count: number
          user_ids: string[]
          complaint_ids: string[]
          category: Database["public"]["Enums"]["complaint_category"]
          priority: Database["public"]["Enums"]["complaint_priority"]
          latest_created_at: string
        }[]
      }
      get_user_complaints: {
        Args: { target_user_id: string }
        Returns: {
          complaint_id: string
          title: string
          description: string
          category: string
          priority: string
          status: string
          attachment: string
          created_at: string
          updated_at: string
          ai_resolved: boolean
        }[]
      }
      get_user_notification_stats: {
        Args: { target_user_id: string }
        Returns: Json
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_user_super_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: undefined
      }
      submit_emoji_feedback: {
        Args: {
          user_id_param: string
          rating_emoji: string
          description_text?: string
          request_id_param?: string
        }
        Returns: Json
      }
      trigger_feedback_request: {
        Args: {
          admin_id: string
          target_email: string
          request_metadata?: Json
        }
        Returns: Json
      }
      update_complaint_status: {
        Args: {
          target_complaint_id: string
          new_status: string
          admin_user_id?: string
        }
        Returns: boolean
      }
      validate_feedback_eligibility: {
        Args: { target_email: string }
        Returns: Json
      }
    }
    Enums: {
      complaint_category:
        | "Software Bug"
        | "Login Issue"
        | "Performance"
        | "Network"
        | "Technical Support"
        | "other"
      complaint_priority: "low" | "medium" | "high" | "urgent"
      complaint_status: "open" | "in_progress" | "resolved" | "closed"
      ticket_status: "open" | "assigned" | "in_progress" | "resolved" | "closed"
      user_role: "user" | "admin" | "agent"
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
      complaint_category: [
        "Software Bug",
        "Login Issue",
        "Performance",
        "Network",
        "Technical Support",
        "other",
      ],
      complaint_priority: ["low", "medium", "high", "urgent"],
      complaint_status: ["open", "in_progress", "resolved", "closed"],
      ticket_status: ["open", "assigned", "in_progress", "resolved", "closed"],
      user_role: ["user", "admin", "agent"],
    },
  },
} as const
