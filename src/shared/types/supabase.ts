export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      todos: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      salon_projects: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          salon_id: string;
          status: 'active' | 'archived';
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          salon_id: string;
          status?: 'active' | 'archived';
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          salon_id?: string;
          status?: 'active' | 'archived';
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salon_projects_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          },
        ];
      };
      salon_assets: {
        Row: {
          description: string | null;
          id: string;
          metadata: Json;
          original_url: string;
          project_id: string;
          status: 'uploaded' | 'ready_for_generation';
          storage_path: string;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          metadata?: Json;
          original_url: string;
          project_id: string;
          status?: 'uploaded' | 'ready_for_generation';
          storage_path: string;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          metadata?: Json;
          original_url?: string;
          project_id?: string;
          status?: 'uploaded' | 'ready_for_generation';
          storage_path?: string;
          uploaded_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salon_assets_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'salon_projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salon_assets_uploaded_by_fkey';
            columns: ['uploaded_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          },
        ];
      };
      salon_generation_jobs: {
        Row: {
          asset_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          error_message: string | null;
          id: string;
          parameters: Json;
          project_id: string;
          response_id: string | null;
          started_at: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          variation_count: number;
        };
        Insert: {
          asset_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          error_message?: string | null;
          id?: string;
          parameters: Json;
          project_id: string;
          response_id?: string | null;
          started_at?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          variation_count?: number;
        };
        Update: {
          asset_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          error_message?: string | null;
          id?: string;
          parameters?: Json;
          project_id?: string;
          response_id?: string | null;
          started_at?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          variation_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'salon_generation_jobs_asset_id_fkey';
            columns: ['asset_id'];
            referencedRelation: 'salon_assets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salon_generation_jobs_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          },
          {
            foreignKeyName: 'salon_generation_jobs_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'salon_projects';
            referencedColumns: ['id'];
          },
        ];
      };
      salon_variations: {
        Row: {
          created_at: string;
          generation_job_id: string;
          id: string;
          image_url: string;
          safety_flags: string[];
          status: 'draft' | 'reviewing' | 'approved' | 'rejected';
          storage_path: string;
          variation_rank: number;
        };
        Insert: {
          created_at?: string;
          generation_job_id: string;
          id?: string;
          image_url: string;
          safety_flags?: string[];
          status?: 'draft' | 'reviewing' | 'approved' | 'rejected';
          storage_path: string;
          variation_rank: number;
        };
        Update: {
          created_at?: string;
          generation_job_id?: string;
          id?: string;
          image_url?: string;
          safety_flags?: string[];
          status?: 'draft' | 'reviewing' | 'approved' | 'rejected';
          storage_path?: string;
          variation_rank?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'salon_variations_generation_job_id_fkey';
            columns: ['generation_job_id'];
            referencedRelation: 'salon_generation_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      salon_reviews: {
        Row: {
          comment: string | null;
          id: string;
          reviewed_at: string;
          reviewed_by: string;
          status: 'approved' | 'rejected';
          variation_id: string;
        };
        Insert: {
          comment?: string | null;
          id?: string;
          reviewed_at?: string;
          reviewed_by: string;
          status: 'approved' | 'rejected';
          variation_id: string;
        };
        Update: {
          comment?: string | null;
          id?: string;
          reviewed_at?: string;
          reviewed_by?: string;
          status?: 'approved' | 'rejected';
          variation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salon_reviews_reviewed_by_fkey';
            columns: ['reviewed_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          },
          {
            foreignKeyName: 'salon_reviews_variation_id_fkey';
            columns: ['variation_id'];
            referencedRelation: 'salon_variations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
