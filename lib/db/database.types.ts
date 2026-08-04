export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          byok_key: string | null;
          byok_provider: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          byok_key?: string | null;
          byok_provider?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          byok_key?: string | null;
          byok_provider?: string | null;
          created_at?: string;
        };
        Relationships: any[];
      };
      user_stats: {
        Row: {
          user_id: string;
          xp: number;
          coins: number;
          current_streak: number;
          longest_streak: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          xp?: number;
          coins?: number;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          xp?: number;
          coins?: number;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
        };
        Relationships: any[];
      };
      routine_blocks: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          category: string;
          start_time: number;
          end_time: number;
          type: "PLAN" | "ACTUAL";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          category: string;
          start_time: number;
          end_time: number;
          type: "PLAN" | "ACTUAL";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          category?: string;
          start_time?: number;
          end_time?: number;
          type?: "PLAN" | "ACTUAL";
          created_at?: string;
        };
        Relationships: any[];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          created_at: string;
          completed_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          created_at?: string;
          completed_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          created_at?: string;
          completed_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: any[];
      };
      journals: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          ai_analysis: Json | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          ai_analysis?: Json | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          ai_analysis?: Json | null;
          date?: string;
          created_at?: string;
        };
        Relationships: any[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
