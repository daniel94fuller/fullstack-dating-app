"use client";

import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // 🔥 SIGN UP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await upsertUser(data.user);
        }

        // ✅ If email confirm OFF → session exists
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setError("Check your email to confirm your account");
        }
      } else {
        // 🔥 SIGN IN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await upsertUser(data.user);
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.log("AUTH ERROR:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 SAFE UPSERT FUNCTION (fixes your 400 error)
  async function upsertUser(user: any) {
    const username = user.email?.split("@")[0] || `user_${user.id.slice(0, 6)}`;

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        username,
        full_name: "",
        avatar_url: "",
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("USER UPSERT ERROR:", error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* HEADER */}
        <div className="text-center">
          <Logo />

          <p className="opacity-70">
            {isSignUp ? "Create Your Account" : "Sign in to your account"}
          </p>
        </div>

        {/* FORM */}
        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
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

        {/* TOGGLE */}
        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-500 hover:opacity-80 text-sm"
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
