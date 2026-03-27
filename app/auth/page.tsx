"use client";

import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // 🔥 SMART REDIRECT (based on profile completeness)
  useEffect(() => {
    async function checkProfile() {
      if (!user || authLoading) return;

      const { data } = await supabase
        .from("users")
        .select("full_name, avatar_url, birthdate, instagram")
        .eq("id", user.id)
        .single();

      const isComplete =
        data?.full_name &&
        data?.avatar_url &&
        data?.birthdate &&
        data?.instagram;

      if (!isComplete) {
        router.push("/complete-profile");
      } else {
        router.push("/");
      }
    }

    checkProfile();
  }, [user, authLoading, router, supabase]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await ensureUserExists(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await ensureUserExists(data.user);
        }
      }

      // ❌ No redirect here — handled by useEffect
    } catch (err: any) {
      console.log("AUTH ERROR:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 CREATE USER ONLY IF NOT EXISTS
  async function ensureUserExists(user: any) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) return;

    const username =
      user.email?.split("@")[0] || `user_${user.id?.slice(0, 6)}` || "user";

    const { error } = await supabase.from("users").insert({
      id: user.id,
      email: user.email ?? "",
      username,
      full_name: "",
      avatar_url: "",
      instagram: "",
      gender: "other",
      birthdate: null, // 🔥 force onboarding
      location: "San Francisco",
    });

    if (error) {
      console.error("USER CREATE ERROR:", error.message || error);
    }
  }

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Logo />
          <p className="opacity-70">
            {isSignUp ? "Create Your Account" : "Sign in to your account"}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="match-button w-full"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-500 text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
