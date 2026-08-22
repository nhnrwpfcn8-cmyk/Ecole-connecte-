import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qdiauunabyzjymaswadi.supabase.co";

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabasePublishableKey) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY est manquante dans Vercel."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
