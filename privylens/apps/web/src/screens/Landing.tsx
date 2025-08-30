// src/screens/Landing.tsx
'use client';
import React from 'react';
import { useAuth } from '@/auth/AuthProvider';

export function Landing() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1011] text-gray-100">
      {/* --- Background effects (no libraries) --- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* soft radial glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-[#10a37f]/20 blur-3xl" />
        {/* secondary glow */}
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full bg-emerald-500/10 blur-3xl" />
        {/* faint grid */}
        <div className="absolute inset-0 opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* --- Top bar --- */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-7 w-7 rounded-full bg-[#10a37f] shadow-[0_0_25px_#10a37f66]" />
            <span className="text-sm font-semibold tracking-wide text-gray-100">PrivyLens</span>
          </div>
          <button
            onClick={signInWithGoogle}
            className="rounded-lg bg-[#10a37f] px-3 py-1.5 text-sm font-medium text-white shadow-[0_8px_30px_rgba(16,163,127,.35)] transition hover:brightness-110"
          >
            Continue with Google
          </button>
        </div>
      </header>

      {/* --- Hero --- */}
      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]" /> Client-side • Private by design
            </div>

            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Redact faces & sensitive text,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                instantly & securely
              </span>
              .
            </h1>

            <p className="mt-4 text-gray-300">
              PrivyLens runs entirely in your browser—no images or messages are uploaded.
              Toggle what to protect (faces, emails, phones, IDs) and we’ll blur or mask it with precision.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10a37f] px-5 py-3 font-medium text-white shadow-[0_15px_40px_rgba(16,163,127,.35)] transition hover:brightness-110"
              >
                {/* minimalist Google G */}
                <svg viewBox="0 0 48 48" width="18" height="18" className="-ml-0.5">
                  <path fill="#FFC107" d="M43.6 20.5H24v7.2h11.3A13 13 0 1 1 24 11a12.5 12.5 0 0 1 8.8 3.4l5-5A20.9 20.9 0 0 0 24 3C12.4 3 3 12.4 3 24s9.4 21 21 21s21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3A12.5 12.5 0 0 1 24 11c3.4 0 6.5 1.3 8.8 3.4l5-5A20.9 20.9 0 0 0 24 3C16 3 9.1 7.1 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 13.9-5.5l-6.4-5.2A12.4 12.4 0 0 1 24 36a12.5 12.5 0 0 1-11.9-8.5l-6 4.6A21 21 0 0 0 24 45z"/>
                  <path fill="#1976D2" d="M43.6 20.5H24v7.2h11.3A12.6 12.6 0 0 1 24 36c-5.3 0-9.8-3.3-11.8-8l-6 4.6A21 21 0 0 0 24 45c11.6 0 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-sm text-gray-400">
                Free • No server uploads • You control policies
              </div>
            </div>
          </div>

          {/* Preview-ish card column */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,.35)] backdrop-blur">
            <div className="mb-4 text-sm font-medium text-gray-200">What you’ll get</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                title="Face Redaction"
                desc="Accurate detection with on-device models."
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M4 8v8m16-8v8M8 4h8M8 20h8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                }
              />
              <FeatureCard
                title="Text Privacy"
                desc="Auto-mask emails, phones, IDs on the fly."
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M18 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                }
              />
              <FeatureCard
                title="Client-side Only"
                desc="Your content never leaves the browser."
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12 3l7 4v6c0 4-7 8-7 8s-7-4-7-8V7l7-4z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                }
              />
              <FeatureCard
                title="Policy Controls"
                desc="Select exactly what to redact."
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M7 8h10M7 12h6M7 16h4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* mini “how it works” */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            <Step n={1} title="Sign in" text="Use Google to start a private session." />
            <Step n={2} title="Choose Policies" text="Pick faces, emails, phones, IDs to protect." />
            <Step n={3} title="Redact Locally" text="Process happens in your browser—instantly." />
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-400">
          © {new Date().getFullYear()} PrivyLens — Privacy-first redaction.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-white/10 bg-[#121415] p-4 transition hover:border-emerald-400/40 hover:bg-[#131718]">
      <div className="mb-2 inline-flex items-center justify-center rounded-md bg-emerald-400/10 p-2 text-emerald-300">
        {icon}
      </div>
      <div className="font-medium text-gray-100">{title}</div>
      <div className="text-sm text-gray-400">{desc}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-5">
      <div className="mb-2 inline-flex items-center gap-2 text-emerald-300">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-semibold text-emerald-200">
          {n}
        </span>
        <span className="text-sm font-medium text-gray-200">{title}</span>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

