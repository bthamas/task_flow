import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () => {
  // Check if environment variables are available
  if (!supabaseUrl || !supabaseKey) {
    // During build time, return a mock client to prevent build failures
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not found during build');
      return null;
    }
    // At runtime, throw error if variables are missing
    throw new Error('Supabase environment variables are required');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
