"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { clientApi } from "@/lib/client-api";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center bg-white px-6">
      <form
        className="panel w-full max-w-md p-7"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await clientApi.reset(token, password);
            router.push("/auth", { transitionTypes: ["nav-back"] });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not reset password");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="text-2xl font-semibold text-black">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">Use at least 6 characters.</p>
        <input
          className="input mt-6 bg-[#f4f7ff]"
          type="password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !token}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
