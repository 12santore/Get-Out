"use client";

import { FormEvent, useState } from "react";
import { signInWithEmail } from "@/lib/supabase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    const { error } = await signInWithEmail(email, inviteCode);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for the sign-in link.");
  };

  return (
    <section className="card mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Private beta login</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your invite code to request a secure magic-link sign in.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          required
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Invite code"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
        />
        <input
          required
          type="email"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="kara@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className="primary-btn w-full">Send Login Link</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </section>
  );
}
