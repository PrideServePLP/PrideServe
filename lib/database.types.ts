export type UserRole = "student" | "ta" | "teacher" | "admin" | "outside_org";

export type OpportunityCategory =
  | "NHS"
  | "Beta"
  | "Tutoring"
  | "General"
  | "Outside Org";

export type OpportunityLocation =
  | "in_school"
  | "after_school"
  | "out_of_school";

export type OpportunityStatus =
  | "pending_certification"
  | "approved"
  | "rejected";

/** Club-internal service hours vs hours served out in the community. */
export type ServiceScope = "club_internal" | "community_external";

export type RecurrencePattern = "daily" | "weekly" | "monthly";

export type SignupStatus = "registered" | "completed" | "canceled";

export type HourLogStatus = "pending" | "verified" | "rejected";

export type NotificationCategory =
  | "signup"
  | "certification"
  | "hours"
  | "general";

export type HonorSociety =
  | "NHS"
  | "NJHS"
  | "Beta Club"
  | "Spanish Honor Society"
  | "Science National Honor Society";

export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade_level: string | null;
  honor_societies: string[];
  classes: string[];
  is_tech_manager: boolean;
  onboarding_completed: boolean;
};

export type UserInsert = {
  id: string;
  email: string;
  full_name: string;
  role?: UserRole;
  grade_level?: string | null;
  honor_societies?: string[];
  classes?: string[];
  is_tech_manager?: boolean;
  onboarding_completed?: boolean;
};

export type UserUpdate = Partial<Omit<UserInsert, "id">>;

export type OpportunityRow = {
  id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  honor_society: HonorSociety | null;
  service_scope: ServiceScope;
  location: OpportunityLocation;
  event_date: string;
  block_time: string | null;
  hours_value: number;
  created_by: string;
  assigned_student_id: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  organization_name: string | null;
  required_volunteers: number | null;
  status: OpportunityStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type OpportunityInsert = {
  id?: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  honor_society?: HonorSociety | null;
  service_scope?: ServiceScope;
  location: OpportunityLocation;
  event_date: string;
  block_time?: string | null;
  hours_value: number;
  created_by: string;
  assigned_student_id?: string | null;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  organization_name?: string | null;
  required_volunteers?: number | null;
  status?: OpportunityStatus;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type OpportunityUpdate = Partial<OpportunityInsert>;

export type EventSignupRow = {
  id: string;
  opportunity_id: string;
  student_id: string;
  signed_up_at: string;
  status: SignupStatus;
};

export type EventSignupInsert = {
  id?: string;
  opportunity_id: string;
  student_id: string;
  signed_up_at?: string;
  status?: SignupStatus;
};

export type EventSignupUpdate = Partial<EventSignupInsert>;

export type HourLogRow = {
  id: string;
  student_id: string;
  opportunity_id: string | null;
  activity_title: string | null;
  honor_society: HonorSociety | null;
  service_date: string;
  hours_logged: number;
  reflection_text: string | null;
  proof_photo_url: string | null;
  supervisor_name: string | null;
  supervisor_email: string | null;
  supervisor_phone: string | null;
  supervisor_signature_status: boolean;
  status: HourLogStatus;
  verified_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type HourLogInsert = {
  id?: string;
  student_id: string;
  opportunity_id?: string | null;
  activity_title?: string | null;
  honor_society?: HonorSociety | null;
  service_date?: string;
  hours_logged: number;
  reflection_text?: string | null;
  proof_photo_url?: string | null;
  supervisor_name?: string | null;
  supervisor_email?: string | null;
  supervisor_phone?: string | null;
  supervisor_signature_status?: boolean;
  status?: HourLogStatus;
  verified_by?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

export type HourLogUpdate = Partial<HourLogInsert>;

export type NotificationRow = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationInsert = {
  id?: string;
  user_id: string;
  category?: NotificationCategory;
  title: string;
  message: string;
  href?: string | null;
  is_read?: boolean;
  created_at?: string;
};

export type NotificationUpdate = Partial<
  Pick<NotificationRow, "is_read" | "title" | "message">
>;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: OpportunityInsert;
        Update: OpportunityUpdate;
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_assigned_student_id_fkey";
            columns: ["assigned_student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      event_signups: {
        Row: EventSignupRow;
        Insert: EventSignupInsert;
        Update: EventSignupUpdate;
        Relationships: [
          {
            foreignKeyName: "event_signups_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_signups_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      hour_logs: {
        Row: HourLogRow;
        Insert: HourLogInsert;
        Update: HourLogUpdate;
        Relationships: [
          {
            foreignKeyName: "hour_logs_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hour_logs_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hour_logs_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_or_tech_manager: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_honor_society_category: {
        Args: { cat: OpportunityCategory };
        Returns: boolean;
      };
      user_enrolled_in_honor_society: {
        Args: { p_user_id: string; cat: OpportunityCategory };
        Returns: boolean;
      };
      user_in_society: {
        Args: { p_user_id: string; p_society: string };
        Returns: boolean;
      };
      review_opportunity: {
        Args: {
          p_opportunity_id: string;
          p_status: OpportunityStatus;
          p_notes?: string | null;
        };
        Returns: OpportunityRow;
      };
      review_hour_logs: {
        Args: {
          p_log_ids: string[];
          p_status: HourLogStatus;
          p_notes?: string | null;
        };
        Returns: HourLogRow[];
      };
      notify_user: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_message: string;
          p_category?: NotificationCategory;
          p_href?: string | null;
        };
        Returns: undefined;
      };
      is_school_email: {
        Args: { p_email: string };
        Returns: boolean;
      };
      complete_onboarding: {
        Args: {
          p_role: UserRole;
          p_full_name: string;
          p_grade_level?: string | null;
          p_honor_societies?: string[];
          p_classes?: string[];
        };
        Returns: UserRow;
      };
    };
    Enums: {
      user_role: UserRole;
      opportunity_category: OpportunityCategory;
      opportunity_location: OpportunityLocation;
      opportunity_status: OpportunityStatus;
      service_scope: ServiceScope;
      recurrence_pattern: RecurrencePattern;
      signup_status: SignupStatus;
      hour_log_status: HourLogStatus;
      notification_category: NotificationCategory;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicTable = keyof Database["public"]["Tables"];

export type Tables<T extends PublicTable> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends PublicTable> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends PublicTable> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
