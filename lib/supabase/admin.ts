import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Admin client with service role key - bypasses RLS
// Only use on the server side for trusted operations
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
