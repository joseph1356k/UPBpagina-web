/**
 * Database type — mirrors `supabase/migrations/*.sql`.
 *
 * Hand-written; regenerate from the live project once it exists:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > lib/supabase/types.ts
 *
 * Shape must satisfy postgrest-js's `GenericSchema`:
 *   - Each table has Row / Insert / Update / Relationships
 *   - Each function has Args / Returns
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string; // ISO 8601 with timezone

export type DocumentTypeDb = "CC" | "CE" | "TI" | "PP";
export type CeremonyStatusDb =
  | "draft"
  | "open"
  | "closed"
  | "in_progress"
  | "completed";
export type GraduateStatusDb =
  | "eligible"
  | "not_eligible"
  | "registered"
  | "completed";
export type GuestStatusDb = "pending" | "invited" | "checked_in" | "revoked";
export type UserRoleDb = "admin" | "scanner" | "coordinator" | "organizer";
export type ScanResultDb = "allowed" | "denied";
export type ScanDeniedReasonDb =
  | "already_used"
  | "invalid_signature"
  | "wrong_ceremony"
  | "outside_time_window"
  | "revoked"
  | "not_found";

export interface Database {
  public: {
    Tables: {
      ceremonies: {
        Row: {
          id: string;
          name: string;
          event_type: string;
          email_template: string;
          date: string;
          start_time: string;
          end_time: string;
          venue: string;
          campus: string;
          faculty: string;
          status: CeremonyStatusDb;
          registration_closes_at: Timestamp;
          max_guests_default: number;
          custom_data: Record<string, unknown>;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          name: string;
          event_type?: string;
          email_template?: string;
          date: string;
          start_time: string;
          end_time: string;
          venue: string;
          campus: string;
          faculty: string;
          status?: CeremonyStatusDb;
          registration_closes_at: Timestamp;
          max_guests_default?: number;
          custom_data?: Record<string, unknown>;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          name?: string;
          event_type?: string;
          email_template?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          venue?: string;
          campus?: string;
          faculty?: string;
          status?: CeremonyStatusDb;
          registration_closes_at?: Timestamp;
          max_guests_default?: number;
          custom_data?: Record<string, unknown>;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      event_types: {
        Row: {
          value: string;
          label: string;
          event_noun: string;
          participant_singular: string;
          participant_plural: string;
          guest_singular: string;
          guest_plural: string;
          invite_phrase: string;
          photo_recommended: boolean;
          default_template: string;
          custom_fields: unknown;
          is_builtin: boolean;
          active: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          value: string;
          label: string;
          event_noun?: string;
          participant_singular?: string;
          participant_plural?: string;
          guest_singular?: string;
          guest_plural?: string;
          invite_phrase?: string;
          photo_recommended?: boolean;
          default_template?: string;
          custom_fields?: unknown;
          is_builtin?: boolean;
          active?: boolean;
          sort_order?: number;
        };
        Update: {
          label?: string;
          event_noun?: string;
          participant_singular?: string;
          participant_plural?: string;
          guest_singular?: string;
          guest_plural?: string;
          invite_phrase?: string;
          photo_recommended?: boolean;
          default_template?: string;
          custom_fields?: unknown;
          active?: boolean;
          sort_order?: number;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      event_organizers: {
        Row: {
          ceremony_id: string;
          user_id: string;
          created_at: Timestamp;
        };
        Insert: {
          ceremony_id: string;
          user_id: string;
          created_at?: Timestamp;
        };
        Update: {
          ceremony_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRoleDb;
          active: boolean;
          last_sign_in_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRoleDb;
          active?: boolean;
          last_sign_in_at?: Timestamp | null;
          created_at?: Timestamp;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: UserRoleDb;
          active?: boolean;
          last_sign_in_at?: Timestamp | null;
        };
        Relationships: [];
      };
      graduates: {
        Row: {
          id: string;
          ceremony_id: string;
          document_type: DocumentTypeDb;
          document_number: string;
          student_code: string;
          full_name: string;
          email: string;
          program: string;
          faculty: string;
          max_guests: number;
          status: GraduateStatusDb;
          notified_at: Timestamp | null;
          photo_url: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          ceremony_id: string;
          document_type: DocumentTypeDb;
          document_number: string;
          student_code: string;
          full_name: string;
          email: string;
          program: string;
          faculty: string;
          max_guests?: number;
          status?: GraduateStatusDb;
          notified_at?: Timestamp | null;
          photo_url?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          document_type?: DocumentTypeDb;
          document_number?: string;
          student_code?: string;
          full_name?: string;
          email?: string;
          program?: string;
          faculty?: string;
          max_guests?: number;
          status?: GraduateStatusDb;
          notified_at?: Timestamp | null;
          photo_url?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [
          {
            foreignKeyName: "graduates_ceremony_id_fkey";
            columns: ["ceremony_id"];
            referencedRelation: "ceremonies";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: {
          id: string;
          graduate_id: string;
          full_name: string;
          document_number: string | null;
          email: string | null;
          relationship: string | null;
          status: GuestStatusDb;
          invitation_token: string;
          invited_at: Timestamp | null;
          checked_in_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          graduate_id: string;
          full_name: string;
          document_number?: string | null;
          email?: string | null;
          relationship?: string | null;
          status?: GuestStatusDb;
          invitation_token?: string;
          invited_at?: Timestamp | null;
          checked_in_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          full_name?: string;
          document_number?: string | null;
          email?: string | null;
          relationship?: string | null;
          status?: GuestStatusDb;
          invited_at?: Timestamp | null;
          checked_in_at?: Timestamp | null;
          updated_at?: Timestamp;
        };
        Relationships: [
          {
            foreignKeyName: "guests_graduate_id_fkey";
            columns: ["graduate_id"];
            referencedRelation: "graduates";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_events: {
        Row: {
          id: string;
          guest_id: string | null;
          scanned_by_user_id: string;
          scanned_at: Timestamp;
          result: ScanResultDb;
          reason: ScanDeniedReasonDb | null;
        };
        Insert: {
          id?: string;
          guest_id?: string | null;
          scanned_by_user_id: string;
          scanned_at?: Timestamp;
          result: ScanResultDb;
          reason?: ScanDeniedReasonDb | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "scan_events_guest_id_fkey";
            columns: ["guest_id"];
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_events_scanned_by_user_id_fkey";
            columns: ["scanned_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          summary: string;
          at: Timestamp;
          metadata: Json | null;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          summary: string;
          at?: Timestamp;
          metadata?: Json | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_invitation_by_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      validate_qr_token: {
        Args: { p_token: string; p_scanner_id: string };
        Returns: Json;
      };
      get_ceremony_stats: {
        Args: { p_ceremony_id: string };
        Returns: Json;
      };
      get_overview_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      graduate_generate_otp: {
        Args: { p_document_number: string; p_ip?: string | null };
        Returns: Json;
      };
      graduate_verify_otp: {
        Args: { p_graduate_id: string; p_code: string };
        Returns: Json;
      };
      graduate_from_session: {
        Args: { p_token: string };
        Returns: string | null;
      };
      graduate_revoke_session: {
        Args: { p_token: string };
        Returns: void;
      };
      touch_user_login: {
        Args: { p_user_id: string };
        Returns: void;
      };
      is_staff: {
        Args: { p_roles?: UserRoleDb[] };
        Returns: boolean;
      };
    };
    Enums: {
      document_type: DocumentTypeDb;
      ceremony_status: CeremonyStatusDb;
      graduate_status: GraduateStatusDb;
      guest_status: GuestStatusDb;
      user_role: UserRoleDb;
      scan_result: ScanResultDb;
      scan_denied_reason: ScanDeniedReasonDb;
    };
    CompositeTypes: Record<string, never>;
  };
}
