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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      journal_logs: {
        Row: {
          content: string
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_definitions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_definitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_logs: {
        Row: {
          id: string
          journal_log_id: string | null
          metric_id: string
          recorded_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          journal_log_id?: string | null
          metric_id: string
          recorded_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          id?: string
          journal_log_id?: string | null
          metric_id?: string
          recorded_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_logs_journal_log_id_fkey"
            columns: ["journal_log_id"]
            isOneToOne: false
            referencedRelation: "journal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_logs_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
<<<<<<< HEAD
=======
          display_name: string | null
>>>>>>> public-release
          global_context: string | null
          global_context_updated_at: string | null
          has_claimed_trial: boolean
          id: string
<<<<<<< HEAD
=======
          last_username_update: string | null
>>>>>>> public-release
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
<<<<<<< HEAD
=======
          display_name?: string | null
>>>>>>> public-release
          global_context?: string | null
          global_context_updated_at?: string | null
          has_claimed_trial?: boolean
          id: string
<<<<<<< HEAD
=======
          last_username_update?: string | null
>>>>>>> public-release
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
<<<<<<< HEAD
=======
          display_name?: string | null
>>>>>>> public-release
          global_context?: string | null
          global_context_updated_at?: string | null
          has_claimed_trial?: boolean
          id?: string
<<<<<<< HEAD
=======
          last_username_update?: string | null
>>>>>>> public-release
          username?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          linked_block_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          linked_block_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          linked_block_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_block_id_fkey"
            columns: ["linked_block_id"]
            isOneToOne: false
            referencedRelation: "timeline_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_blocks: {
        Row: {
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          label: string
          source: Database["public"]["Enums"]["routine_block_source"]
          start_time: string
          type: Database["public"]["Enums"]["routine_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          label: string
          source: Database["public"]["Enums"]["routine_block_source"]
          start_time: string
          type: Database["public"]["Enums"]["routine_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          label?: string
          source?: Database["public"]["Enums"]["routine_block_source"]
          start_time?: string
          type?: Database["public"]["Enums"]["routine_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_generations: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      user_ai_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
<<<<<<< HEAD
      [_ in never]: never
=======
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
>>>>>>> public-release
    }
    Enums: {
      routine_block_source: "ai" | "manual"
      routine_type: "plan" | "actual"
      task_status: "pending" | "completed"
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
      routine_block_source: ["ai", "manual"],
      routine_type: ["plan", "actual"],
      task_status: ["pending", "completed"],
    },
  },
} as const
