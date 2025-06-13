// This is a dummy implementation of supabase client for compatibility
// during the migration to local storage.
// TODO: Remove this file once all supabase references are replaced with local storage

type SupabaseClient = {
  // Add any methods that are actually used in your codebase
  // This is a minimal implementation to satisfy TypeScript
  rpc: (fn: string, params?: any) => {
    data: any;
    error: Error | null;
  };
  from: (table: string) => {
    delete: () => Promise<{ error: Error | null }>;
  };
};

export const supabase: SupabaseClient = {
  rpc: () => ({
    data: null,
    error: new Error('Supabase is not available in this version'),
  }),
  from: () => ({
    delete: async () => ({ error: new Error('Supabase is not available in this version') }),
  }),
};

export default supabase;
