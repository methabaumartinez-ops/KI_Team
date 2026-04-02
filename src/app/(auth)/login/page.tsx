// =============================================================================
// AgentIA-Automate — Login Page (Server Component)
// =============================================================================
// Minimal login form using Supabase Auth.
// Styled with black + gold design tokens.
// Server Action handles email/password sign-in.
// =============================================================================

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signInAction(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("E-Mail und Passwort sind erforderlich")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Ungültige Anmeldedaten")}`);
  }

  redirect(redirectTo);
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const redirectTo = params.redirectTo || "/dashboard";

  return (
    <div className="flex flex-1 items-center justify-center"
         style={{ background: "var(--color-surface-primary)" }}>
      <div
        className="w-full max-w-sm animate-fade-in"
        style={{ padding: "var(--space-2xl)" }}
      >
        {/* --- Header --- */}
        <div className="text-center" style={{ marginBottom: "var(--space-2xl)" }}>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-text-accent)" }}
          >
            AgentIA
          </h1>
          <p
            className="text-sm"
            style={{
              color: "var(--color-text-secondary)",
              marginTop: "var(--space-sm)",
            }}
          >
            Melde dich an, um fortzufahren
          </p>
        </div>

        {/* --- Error Banner --- */}
        {error && (
          <div
            className="text-sm text-center"
            style={{
              padding: "var(--space-sm) var(--space-md)",
              marginBottom: "var(--space-lg)",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {/* --- Login Form --- */}
        <form action={signInAction} className="flex flex-col" style={{ gap: "var(--space-lg)" }}>
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
            <label
              htmlFor="login-email"
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              E-Mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@agentia.ch"
              className="text-sm outline-none"
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                transition: "var(--transition-fast)",
              }}
              onFocus={undefined}
            />
          </div>

          <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
            <label
              htmlFor="login-password"
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Passwort
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="text-sm outline-none"
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                transition: "var(--transition-fast)",
              }}
            />
          </div>

          <button
            type="submit"
            className="text-sm font-semibold cursor-pointer"
            style={{
              padding: "var(--space-sm) var(--space-md)",
              background: "var(--color-accent)",
              color: "var(--color-surface-primary)",
              borderRadius: "var(--radius-md)",
              border: "none",
              transition: "var(--transition-fast)",
            }}
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
