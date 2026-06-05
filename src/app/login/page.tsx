"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, Loader2, CircleAlert } from "lucide-react";

const PROMO_GRADIENT =
  "radial-gradient(115% 120% at 78% 16%, oklch(0.68 0.16 256 / 0.95), transparent 56%)," +
  "radial-gradient(95% 100% at 100% 58%, oklch(0.58 0.19 264 / 0.92), transparent 52%)," +
  "radial-gradient(120% 120% at 14% 96%, oklch(0.95 0.04 248 / 0.95), transparent 55%)," +
  "radial-gradient(110% 110% at 6% 8%, oklch(0.95 0.045 246), transparent 58%)," +
  "linear-gradient(140deg, oklch(0.92 0.06 250), oklch(0.52 0.18 260))";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid email or password. Please try again.");
      }
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[20rem]">
      <Image
        src="/safeen.png"
        alt="SAFEEN Subsea"
        width={500}
        height={150}
        priority
        className="mb-[1.4rem] h-[2.3rem] w-auto object-contain"
      />
      <h1 className="text-[1.6rem] font-semibold leading-[1.05] tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 max-w-[26ch] text-[0.875rem] leading-[1.45] text-subtle">
        Sign in to your SAFEEN workspace to manage stock, orders, and movements in
        one place.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-[0.95rem]">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[0.65rem] bg-[oklch(0.97_0.018_25)] px-3 py-2.5 text-[0.81rem] leading-[1.4] text-[oklch(0.52_0.15_25)] shadow-[inset_0_0_0_1px_oklch(0.85_0.05_25_/_0.5)]"
          >
            <CircleAlert className="mt-0.5 size-[0.95rem] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Joined email + password group */}
        <div className="overflow-hidden rounded-[0.65rem] border border-line bg-field transition focus-within:border-brand focus-within:shadow-[0_0_0_3px_oklch(0.55_0.18_256_/_0.16)]">
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[2.85rem] w-full bg-transparent px-[0.9rem] text-[0.9rem] text-ink outline-none transition placeholder:text-[oklch(0.7_0.006_80)] focus:bg-surface"
            />
          </div>
          <div className="relative border-t border-line">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[2.85rem] w-full bg-transparent pr-[2.6rem] pl-[0.9rem] text-[0.9rem] text-ink outline-none transition placeholder:text-[oklch(0.7_0.006_80)] focus:bg-surface"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              aria-pressed={showPwd}
              className="absolute top-1/2 right-1.5 grid size-[1.9rem] -translate-y-1/2 place-items-center rounded-[0.45rem] text-faint transition hover:bg-[oklch(0.94_0.003_80)] hover:text-ink"
            >
              {showPwd ? <EyeOff className="size-[0.95rem]" /> : <Eye className="size-[0.95rem]" />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[0.79rem] text-subtle select-none">
            <span className="relative inline-grid">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="peer absolute size-0 opacity-0"
              />
              <span className="grid size-[1.05rem] place-items-center rounded-[0.32rem] border-[1.5px] border-line bg-surface transition peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:shadow-[0_0_0_3px_oklch(0.55_0.18_256_/_0.22)]">
                <Check className="size-[0.7rem] text-primary-foreground opacity-0 transition peer-checked:opacity-100" strokeWidth={3.2} />
              </span>
            </span>
            Remember me
          </label>
          <button
            type="button"
            onClick={() =>
              setError("Contact IT support to reset your password.")
            }
            className="text-[0.78rem] text-subtle transition hover:text-ink"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign in */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-[2.85rem] w-full items-center justify-center gap-2 rounded-[0.65rem] bg-[linear-gradient(to_bottom,oklch(0.32_0.006_60),oklch(0.215_0.006_60)_58%)] text-[0.9rem] font-semibold text-primary-foreground shadow-[0_1px_2px_oklch(0.2_0.01_60_/_0.2),0_8px_20px_-10px_oklch(0.2_0.01_60_/_0.5),inset_0_1px_0_oklch(1_0_0_/_0.6),inset_0_-1px_1px_oklch(0_0_0_/_0.18)] transition hover:bg-[linear-gradient(to_bottom,oklch(0.36_0.006_60),oklch(0.27_0.006_60)_58%)] active:translate-y-px disabled:cursor-default disabled:opacity-70"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Org line */}
      <div className="my-[1.15rem] flex items-center gap-3 text-[0.74rem] text-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        Made for AD Ports Group
      </div>

      <p className="text-center text-[0.78rem] text-subtle">
        Trouble signing in?{" "}
        <a
          href="mailto:itsupport@safeen.ae"
          className="font-medium text-brand hover:underline"
        >
          Contact IT support
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[oklch(0.93_0.004_80)] px-6 py-8">
      <main className="grid w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-3xl bg-surface shadow-[0_1px_2px_oklch(0.5_0.01_70_/_0.05),0_30px_60px_-30px_oklch(0.45_0.02_60_/_0.32)] duration-500 min-[800px]:max-w-[60rem] min-[800px]:min-h-[33rem] min-[800px]:grid-cols-[1.02fr_0.98fr]">
        {/* Left promo — blue gradient mesh */}
        <aside className="relative isolate m-3 hidden flex-col justify-end overflow-hidden rounded-[1.05rem] p-8 min-[800px]:flex">
          <div className="absolute inset-0 -z-10" style={{ background: PROMO_GRADIENT }} />
          <div>
            <p
              className="mb-2.5 text-[0.78rem] font-medium tracking-[0.01em]"
              style={{ color: "oklch(0.32 0.07 262 / 0.9)" }}
            >
              Inventory, in order.
            </p>
            <h2
              className="max-w-[13ch] text-[1.72rem] font-semibold leading-[1.12] tracking-tight text-balance"
              style={{ color: "oklch(0.26 0.07 264)" }}
            >
              Track every unit with clarity and control.
            </h2>
          </div>
        </aside>

        {/* Right form */}
        <section className="flex flex-col justify-center px-12 py-12 max-[800px]:px-8 max-[800px]:py-10">
          <Suspense>
            <LoginForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
