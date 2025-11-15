// Supabase generated types
// This file should be generated using: supabase gen types typescript --local
// For now, using a minimal type definition

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          filename: string;
          file_size: number | null;
          mime_type: string | null;
          storage_path: string | null;
          status: string;
          customer_example: Json | null;
          patches: Json | null;
          original_text: string | null;
          confidence: number | null;
          warnings: string[] | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          manual_edits: Json;
          exported_at: string | null;
          export_response: Json | null;
          created_at: string;
          updated_at: string;
          workspace_id: string | null;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>>;
      };
      document_chunks: {
        Row: {
          id: string;
          project_id: string;
          page_number: number;
          chunk_index: number;
          text_content: string;
          bbox: Json | null;
          extracted_field: string | null;
          field_type: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_chunks']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['document_chunks']['Row'], 'id' | 'created_at'>>;
      };
      ai_suggestions: {
        Row: {
          id: string;
          project_id: string;
          suggestion_type: string;
          content: Json;
          status: string;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          model_name: string | null;
          model_version: string | null;
        };
        Insert: Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['ai_suggestions']['Row'], 'id' | 'created_at'>>;
      };
      feature_flags: {
        Row: {
          id: string;
          flag_name: string;
          enabled: boolean;
          config: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['feature_flags']['Row'], 'id' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['feature_flags']['Row'], 'id'>>;
      };
    };
  };
}
