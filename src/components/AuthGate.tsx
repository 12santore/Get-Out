"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasSupabaseBrowserConfig, supabaseBrowser } from "@/lib/supabase/browser";

type AuthGateProps = {
  children: React.ReactNode;
};

const publicRoutes = new Set(["/login"]);

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const isPublicRoute = useMemo(() => publicRoutes.has(pathname), [pathname]);

  useEffect(() => {
    let mounted = true;

    // If Supabase is not configured, keep only the login page accessible.
    if (!hasSupabaseBrowserConfig || !supabaseBrowser) {
      setAuthenticated(false);
      setChecking(false);
      return () => {
        mounted = false;
      };
    }
    const client = supabaseBrowser;

    const resolveSession = async () => {
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      setAuthenticated(Boolean(data.session));
      setChecking(false);
    };

    void resolveSession();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthenticated(Boolean(session));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checking) return;

    if (!authenticated && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (authenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [authenticated, checking, isPublicRoute, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <section className="card mx-auto max-w-md p-6">
        <h1 className="text-lg font-semibold">Securing your session...</h1>
        <p className="mt-2 text-sm text-slate-600">Please wait while we verify access.</p>
      </section>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
