export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      drivers: {
        Row: {
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          driver_license: string
          id: string
          license_plate: string
          rating: number
          status: string
          updated_at: string
          vehicle_color: string
          vehicle_model: string
        }
        Insert: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          driver_license: string
          id: string
          license_plate: string
          rating?: number
          status?: string
          updated_at?: string
          vehicle_color: string
          vehicle_model: string
        }
        Update: {
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          driver_license?: string
          id?: string
          license_plate?: string
          rating?: number
          status?: string
          updated_at?: string
          vehicle_color?: string
          vehicle_model?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          from_id: string
          id: string
          rating: number
          ride_id: string
          to_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_id: string
          id?: string
          rating: number
          ride_id: string
          to_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_id?: string
          id?: string
          rating?: number
          ride_id?: string
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_logs: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          driver_id: string | null
          estimated_price: number
          final_price: number | null
          id: string
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          ride_id: string
          started_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          driver_id?: string | null
          estimated_price: number
          final_price?: number | null
          id?: string
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          ride_id: string
          started_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address?: string
          destination_latitude?: number
          destination_longitude?: number
          driver_id?: string | null
          estimated_price?: number
          final_price?: number | null
          id?: string
          passenger_id?: string
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          ride_id?: string
          started_at?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          driver_id: string | null
          estimated_price: number
          final_price: number | null
          id: string
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          driver_id?: string | null
          estimated_price: number
          final_price?: number | null
          id?: string
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address?: string
          destination_latitude?: number
          destination_longitude?: number
          driver_id?: string | null
          estimated_price?: number
          final_price?: number | null
          id?: string
          passenger_id?: string
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ride_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
