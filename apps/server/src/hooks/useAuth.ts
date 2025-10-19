// src/hooks/useAuth.ts
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const REQUIRE_AUTH = String(import.meta.env.VITE_REQUIRE_AUTH ?? "1") !== "0";

// === Supabase client setup ===
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export function useAuth() {
  // testing mode (anonymous user)
  if (!REQUIRE_AUTH) {
    const fake = { id: "anon-test-user", email: "anon@test.local" };
    return {
      user: fake,
      loading: false,
      signIn: async () => fake,
      signOut: async () => {},
    };
  }

  // real auth mode
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase not configured, but REQUIRE_AUTH=1");
      setLoading(false);
      return;
    }
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => { sub?.subscription?.unsubscribe(); };
  }, []);

  const signIn = async () => {
    const email = window.prompt("Email for magic-link sign-in:");
    if (!email || !supabase) return;
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin }});
  };
  const signOut = async () => { await supabase?.auth.signOut(); };

  return { user, loading, signIn, signOut };
}
