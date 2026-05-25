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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          bio: string | null;
          city: string | null;
          county: string | null;
          latitude: number | null;
          longitude: number | null;
          business_name: string | null;
          tax_id: string | null;
          specialties: string[] | null;
          gym_locations: string[] | null;
          languages: string[] | null;
          hourly_rate: number | null;
          profile_photo: string | null;
          gallery_photos: string[] | null;
          phone: string | null;
          avail_weekdays: string[];
          avail_weekends: string[];
          is_active: boolean;
          is_featured: boolean;
          certificate_url: string | null;
          certificate_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          bio?: string | null;
          city?: string | null;
          county?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          business_name?: string | null;
          tax_id?: string | null;
          specialties?: string[] | null;
          gym_locations?: string[] | null;
          languages?: string[] | null;
          hourly_rate?: number | null;
          profile_photo?: string | null;
          gallery_photos?: string[] | null;
          phone?: string | null;
          avail_weekdays?: string[];
          avail_weekends?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          certificate_url?: string | null;
          certificate_status?: string;
        };
        Update: {
          full_name?: string | null;
          bio?: string | null;
          city?: string | null;
          county?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          business_name?: string | null;
          tax_id?: string | null;
          specialties?: string[] | null;
          gym_locations?: string[] | null;
          languages?: string[] | null;
          hourly_rate?: number | null;
          profile_photo?: string | null;
          gallery_photos?: string[] | null;
          phone?: string | null;
          avail_weekdays?: string[];
          avail_weekends?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          certificate_url?: string | null;
          certificate_status?: string;
        };
        Relationships: [];
      };
      availability_slots: {
        Row: {
          id: string;
          trainer_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: {
          trainer_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          trainer_id: string;
          visitor_name: string;
          visitor_email: string;
          visitor_phone: string | null;
          appointment_at: string;
          duration_min: number;
          notes: string | null;
          status: "pending" | "confirmed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          visitor_name: string;
          visitor_email: string;
          visitor_phone?: string | null;
          appointment_at: string;
          duration_min?: number;
          notes?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
        };
        Update: {
          visitor_name?: string;
          visitor_email?: string;
          visitor_phone?: string | null;
          appointment_at?: string;
          duration_min?: number;
          notes?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          trainer_id: string;
          sender_name: string;
          sender_email: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          sender_name: string;
          sender_email: string;
          body: string;
          is_read?: boolean;
        };
        Update: {
          sender_name?: string;
          sender_email?: string;
          body?: string;
          is_read?: boolean;
        };
        Relationships: [];
      };
      trainer_gym_locations: {
        Row: {
          id: string;
          trainer_id: string;
          name: string;
          city: string | null;
          postal_code: string | null;
          street_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          name: string;
          city?: string | null;
          postal_code?: string | null;
          street_address?: string | null;
        };
        Update: {
          name?: string;
          city?: string | null;
          postal_code?: string | null;
          street_address?: string | null;
        };
        Relationships: [];
      };
      gyms: {
        Row: {
          id: string;
          name: string;
          city: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          name?: string;
          city?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          trainer_id: string;
          name: string;
          description: string | null;
          price: number;
          sessions: number | null;
          duration_min: number | null;
          is_popular: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          name: string;
          description?: string | null;
          price?: number;
          sessions?: number | null;
          duration_min?: number | null;
          is_popular?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          sessions?: number | null;
          duration_min?: number | null;
          is_popular?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          trainer_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan: "basic" | "featured";
          status: "active" | "past_due" | "cancelled" | "trialing";
          current_period_end: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan: "basic" | "featured";
          status: "active" | "past_due" | "cancelled" | "trialing";
          current_period_end: string;
        };
        Update: {
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string;
          plan?: "basic" | "featured";
          status?: "active" | "past_due" | "cancelled" | "trialing";
          current_period_end?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
