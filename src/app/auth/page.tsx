"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { useAppStore } from "@/lib/store";

export default function AuthPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const register = useAppStore((s) => s.register);
  const login = useAppStore((s) => s.login);
  const signInGuest = useAppStore((s) => s.signInGuest);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace("/home", { transitionTypes: ["nav-forward"] });
  }, [hydrated, user, router]);

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (forgot) {
        const result = await clientApi.forgot(email);
        setResetUrl(result.resetUrl || null);
        return;
      }
      if (mode === "register") {
        await register(name || email.split("@")[0], email, password);
      } else {
        await login(email, password);
      }
      router.push("/home", { transitionTypes: ["nav-forward"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setBusy(true);
    try {
      await signInGuest();
      router.push("/home", { transitionTypes: ["nav-forward"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid flex-1 bg-white lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#f3f4f6] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Link href="/" transitionTypes={["nav-back"]} className="inline-flex items-center gap-2 text-sm text-muted">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="relative">
          <div className="absolute -left-10 top-[-80px] h-72 w-72 rotate-12 rounded-[40px] border-[18px] border-black/10" />
          <h1 className="display relative text-6xl font-extrabold tracking-tight text-black">
            Architect
          </h1>
          <p className="relative mt-4 max-w-sm text-lg text-[#4b5563]">
            Describe the work. Architect plans the agents, builds the app, and keeps the data.
          </p>
        </div>
        <p className="text-sm text-muted">For operators and engineers, on the same project.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" transitionTypes={["nav-back"]} className="mb-8 inline-flex items-center gap-2 text-sm text-muted lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h2 className="text-2xl font-semibold text-black">
            {forgot ? "Reset your password" : mode === "login" ? "Log in to your account" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {forgot
              ? "Enter the email on your account. We’ll give you a private reset link."
              : "Use the same email next time and your projects will still be here."}
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleEmail}>
            {mode === "register" && !forgot && (
              <label className="grid gap-1 text-sm font-medium text-black">
                Name
                <input className="input bg-[#f4f7ff]" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="grid gap-1 text-sm font-medium text-black">
              Email address
              <input
                className="input bg-[#f4f7ff]"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {!forgot && (
              <label className="grid gap-1 text-sm font-medium text-black">
                Password
                <input
                  className="input bg-[#f4f7ff]"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="justify-self-end text-xs text-muted"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </label>
            )}
            {mode === "login" && !forgot && (
              <button
                type="button"
                className="justify-self-end text-sm text-mint"
                onClick={() => {
                  setForgot(true);
                  setError(null);
                  setResetUrl(null);
                }}
              >
                Forgot password?
              </button>
            )}
            {error && <div className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{error}</div>}
            {resetUrl && (
              <a className="text-sm text-mint underline" href={resetUrl}>
                Open your reset link
              </a>
            )}
            <button className="btn btn-primary h-12 w-full" disabled={busy}>
              {busy ? "Please wait…" : forgot ? "Create reset link" : mode === "login" ? "Log in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            {forgot ? (
              <button className="text-mint" onClick={() => setForgot(false)}>
                Back to log in
              </button>
            ) : mode === "login" ? (
              <>
                New to Architect?{" "}
                <button className="text-mint" onClick={() => setMode("register")}>
                  Create your account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="text-mint" onClick={() => setMode("login")}>
                  Log in
                </button>
              </>
            )}
          </div>
          {!forgot && (
            <button className="btn btn-ghost mt-4 w-full" type="button" onClick={() => void handleGuest()} disabled={busy}>
              Continue as guest
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
