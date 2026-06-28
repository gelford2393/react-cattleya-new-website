import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables for server function");
}

/**
 * Server-side Supabase client for use inside Vercel serverless functions.
 *
 * Reuses the same RLS-protected anon key the public browser client uses —
 * this is intentional, not a security gap: the anon key only ever grants the
 * same read access a visitor's browser already has. We read it via
 * `process.env` (not `import.meta.env`) because this file runs in Node,
 * not through Vite's client bundler.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
