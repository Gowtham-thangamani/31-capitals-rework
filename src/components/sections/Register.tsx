"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countries, findCountry } from "@/lib/countries";
import { Reveal } from "@/components/fx/Reveal";

type Step = "form" | "verify" | "success";

const REDIRECT_DELAY_MS = 2500;

export function Register() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("GB");
  const [number, setNumber] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [preview, setPreview] = useState<{ emailCode?: string } | null>(null);

  const dial = useMemo(() => findCountry(country)?.dial ?? "", [country]);

  // Hand the verified registration over to the broker's signup.
  useEffect(() => {
    if (step !== "success" || !redirectUrl) return;
    const id = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [step, redirectUrl]);

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, country, number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send your verification code.");
      setPreview(data.preview ? { emailCode: data.emailCode } : null);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setRedirectUrl(data.redirectUrl || "");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="register" className="relative px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_70%_0%,rgba(255,74,16,0.18),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">Secure onboarding</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
            Verify once.
            <span className="block text-gradient">Then you&apos;re in.</span>
          </h2>
          <p className="mt-6 font-serif text-lg leading-8 text-white/60">
            Name, email, mobile and country. We send one code to your inbox — confirm it and we take you straight
            through to open your trading account.
          </p>
          <div className="mt-10 space-y-4">
            {["Email verification", "Personal onboarding with 31 Capitals", "A desk that stays after go-live"].map(
              (item) => (
                <p key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <ShieldCheck size={18} className="text-orange-300" /> {item}
                </p>
              ),
            )}
          </div>
        </Reveal>

        <Reveal
          delay={0.1}
          className="panel-hot relative overflow-hidden rounded-[2rem] p-6 shadow-[0_0_120px_rgba(255,74,16,0.16)] sm:p-9"
        >
          <div className="mb-6 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/40">
            <span>31 Capitals vault</span>
            <span>{step === "form" ? "01 / identity" : step === "verify" ? "02 / code" : "03 / live"}</span>
          </div>

          {step === "form" ? (
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Sara Ahmed"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/12 bg-[#111] px-4 text-sm text-white outline-none focus:border-orange-400/70"
                  required
                >
                  {countries.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="number">Mobile number</Label>
                <div className="flex gap-2">
                  <div className="flex h-12 min-w-[88px] items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-white/70">
                    {dial}
                  </div>
                  <Input
                    id="number"
                    inputMode="tel"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                    placeholder="Mobile number"
                    className="flex-1"
                  />
                </div>
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <Button type="submit" size="lg" className="shine w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                Send verification code
              </Button>
              <p className="text-center text-[11px] leading-5 text-white/35">
                By continuing you confirm you are 18+ and agree to be contacted about onboarding with 31 Capitals.
              </p>
            </form>
          ) : null}

          {step === "verify" ? (
            <form onSubmit={submitCode} className="space-y-5">
              <div>
                <p className="font-display text-3xl text-white">Enter your code</p>
                <p className="mt-2 text-sm text-white/55">Sent to {email}.</p>
              </div>
              {preview?.emailCode ? (
                <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-50">
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-200/80">Preview delivery</p>
                  <p className="mt-2 text-white/70">
                    Email sending is not connected on this deployment, so the code is shown here.
                  </p>
                  <p className="mt-3 font-mono text-lg tracking-[0.3em] text-white">{preview.emailCode}</p>
                </div>
              ) : null}
              <div>
                <Label htmlFor="emailCode">Email code</Label>
                <Input
                  id="emailCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="font-mono tracking-[0.4em]"
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" size="lg" className="shine flex-1" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                  Confirm and continue
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep("form")}>
                  Edit details
                </Button>
              </div>
            </form>
          ) : null}

          {step === "success" ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="text-orange-300" size={48} />
              <p className="mt-4 font-display text-3xl text-white">Verified</p>
              <p className="mt-2 max-w-sm font-serif text-lg text-white/55">
                Taking you to complete your account registration…
              </p>
              {redirectUrl ? (
                <a
                  href={redirectUrl}
                  className="mt-6 text-sm tracking-[0.22em] text-orange-200 uppercase underline underline-offset-4"
                >
                  Continue now →
                </a>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
