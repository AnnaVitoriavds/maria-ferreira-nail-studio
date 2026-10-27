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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      availability_rules: {
        Row: {
          closing_time: string
          id: string
          interval_minutes: number
          is_active: boolean
          opening_time: string
          slot_step_minutes: number
          weekday: number
        }
        Insert: {
          closing_time: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          opening_time: string
          slot_step_minutes?: number
          weekday: number
        }
        Update: {
          closing_time?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          opening_time?: string
          slot_step_minutes?: number
          weekday?: number
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          end_date: string | null
          end_time: string | null
          id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      booking_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_date: string | null
          new_status: Database["public"]["Enums"]["booking_status"] | null
          new_time: string | null
          old_date: string | null
          old_status: Database["public"]["Enums"]["booking_status"] | null
          old_time: string | null
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_date?: string | null
          new_status?: Database["public"]["Enums"]["booking_status"] | null
          new_time?: string | null
          old_date?: string | null
          old_status?: Database["public"]["Enums"]["booking_status"] | null
          old_time?: string | null
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_date?: string | null
          new_status?: Database["public"]["Enums"]["booking_status"] | null
          new_time?: string | null
          old_date?: string | null
          old_status?: Database["public"]["Enums"]["booking_status"] | null
          old_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          appointment_date: string
          appointment_time: string
          client_name: string
          client_phone: string
          created_at: string
          duration_minutes: number
          id: string
          idempotency_key: string
          notes: string | null
          protocol: string
          reference_image_url: string | null
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          client_name: string
          client_phone: string
          created_at?: string
          duration_minutes?: number
          id?: string
          idempotency_key: string
          notes?: string | null
          protocol: string
          reference_image_url?: string | null
          service_id?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          idempotency_key?: string
          notes?: string | null
          protocol?: string
          reference_image_url?: string | null
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      date_selection_events: {
        Row: {
          anonymous_session_id: string
          created_at: string
          id: string
          selected_date: string
          selected_time: string | null
          service_id: string | null
        }
        Insert: {
          anonymous_session_id: string
          created_at?: string
          id?: string
          selected_date: string
          selected_time?: string | null
          service_id?: string | null
        }
        Update: {
          anonymous_session_id?: string
          created_at?: string
          id?: string
          selected_date?: string
          selected_time?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_selection_events_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          display_order: number
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      special_hours: {
        Row: {
          closing_time: string
          id: string
          note: string | null
          opening_time: string
          special_date: string
        }
        Insert: {
          closing_time: string
          id?: string
          note?: string | null
          opening_time: string
          special_date: string
        }
        Update: {
          closing_time?: string
          id?: string
          note?: string | null
          opening_time?: string
          special_date?: string
        }
        Relationships: []
      }
      studio_settings: {
        Row: {
          about_text: string
          about_title: string
          address: string | null
          booking_notice: string
          business_hours: string | null
          city: string
          google_rating: number
          google_review_count: number
          google_reviews_url: string | null
          hero_image_url: string | null
          id: number
          instagram_url: string
          maps_url: string | null
          pending_hold_enabled: boolean
          pending_hold_minutes: number
          profile_image_url: string | null
          studio_name: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          about_text?: string
          about_title?: string
          address?: string | null
          booking_notice?: string
          business_hours?: string | null
          city?: string
          google_rating?: number
          google_review_count?: number
          google_reviews_url?: string | null
          hero_image_url?: string | null
          id?: number
          instagram_url?: string
          maps_url?: string | null
          pending_hold_enabled?: boolean
          pending_hold_minutes?: number
          profile_image_url?: string | null
          studio_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          about_text?: string
          about_title?: string
          address?: string | null
          booking_notice?: string
          business_hours?: string | null
          city?: string
          google_rating?: number
          google_review_count?: number
          google_reviews_url?: string | null
          hero_image_url?: string | null
          id?: number
          instagram_url?: string
          maps_url?: string | null
          pending_hold_enabled?: boolean
          pending_hold_minutes?: number
          profile_image_url?: string | null
          studio_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          authorized: boolean
          content: string
          created_at: string
          id: string
          is_published: boolean
          rating: number
        }
        Insert: {
          author_name: string
          authorized?: boolean
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          rating?: number
        }
        Update: {
          author_name?: string
          authorized?: boolean
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          rating?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_request: {
        Args: {
          p_client_name: string
          p_client_phone: string
          p_date: string
          p_idempotency_key: string
          p_notes: string
          p_reference_image_url?: string
          p_service_id: string
          p_time: string
        }
        Returns: {
          booking_id: string
          protocol: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      get_available_slots: {
        Args: { p_date: string; p_service_id: string }
        Returns: {
          slot_time: string
        }[]
      }
      get_month_availability: {
        Args: { p_end: string; p_service_id: string; p_start: string }
        Returns: {
          day: string
          slots: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_date_selection: {
        Args: {
          p_date: string
          p_service_id: string
          p_session: string
          p_time: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
