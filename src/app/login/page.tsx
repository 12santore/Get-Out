"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerWithInvite, signInWithPassword } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const register = await registerWithInvite(email, password, inviteCode);
    if (register.error) {
      setMessage(register.error.message);
      setLoading(false);
      return;
    }

    const signIn = await signInWithPassword(email, password);
    if (signIn.error) {
      setMessage(signIn.error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/");
  };

  const onSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await signInWithPassword(email, password);
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/");
  };

  return (
    <section className="card mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Private beta login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Set your password once with an invite code. You will only need your password again if you sign out.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-sm">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 ${mode === "register" ? "bg-white font-semibold" : "text-slate-600"}`}
          onClick={() => setMode("register")}
        >
          Create account
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 ${mode === "signin" ? "bg-white font-semibold" : "text-slate-600"}`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
      </div>

      <form onSubmit={mode === "register" ? onRegister : onSignIn} className="mt-4 space-y-3">
        <input
          required
          type="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="kara@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {mode === "register" && (
          <input
            required
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
        )}
        <input
          required
          type="password"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {mode === "register" && (
          <input
            required
            type="password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        )}
        <button className="primary-btn w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </section>
  );
}
