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

  // 🔥 SMART REDIRECT
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
    } catch (err: any) {
      console.log("AUTH ERROR:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
      birthdate: null,
      location: "San Francisco",
    });

    if (error) {
      console.error("USER CREATE ERROR:", error.message || error);
    }
  }

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 overflow-y-auto">
      {/* LOGO */}
      <div className="text-center mb-10">
        <Logo />
        <h1 className="text-2xl font-semibold mt-6">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          {isSignUp ? "Sign up to start meeting people" : "Sign in to continue"}
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleAuth} className="w-full max-w-md mx-auto space-y-5">
        {/* EMAIL */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      {/* SWITCH */}
      <div className="text-center mt-8">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-400"
        >
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <span className="text-pink-500 font-medium">
            {isSignUp ? "Sign in" : "Create account"}
          </span>
        </button>
      </div>
    </div>
  );
}
