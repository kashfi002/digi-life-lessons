"use client";

/**
 * Register — Digital Life Lessons
 * -----------------------------------------------------------------------
 * Same "paper card on the ink desk" motif as the hero/footer, kept
 * upright and un-rotated here since it's a form people need to read
 * and fill in, not a decorative snippet. A second, slightly rotated
 * card sits behind it purely as texture — same trick as the hero deck.
 *
 * Route: src/app/register/page.jsx  →  /register
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { signUp, signIn } from "@/lib/auth-client";

const PASSWORD_RULES = [
  { key: "upper", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lower", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "length", label: "At least 6 characters", test: (pw) => pw.length >= 6 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const passwordValid = passwordChecks.every((r) => r.passed);
  const canSubmit = name.trim() && email.trim() && passwordValid && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordValid) {
      setError("Password doesn't meet the requirements below.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      image: photoURL.trim() || undefined,
      callbackURL: "/",
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || "Something went wrong. Please try again.");
      return;
    }
    router.push("/");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const { error: googleError } = await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (googleError) {
      setError(googleError.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
    // On success better-auth redirects the browser, so no further state needed.
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#12141C] px-5 py-16">
      <div className="relative w-full max-w-[420px]">
        {/* backing card — texture only */}
        <div className="absolute inset-0 rotate-[3deg] translate-x-2 rounded-2xl bg-[#F5F1E8]/10" />

        <div className="relative rounded-2xl bg-[#F5F1E8] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-10">
          <span className="font-mono text-[11px] tracking-[0.25em] text-[#B08A2E]">
            JOIN THE PLATFORM
          </span>
          <h1
            className="mt-3 text-[28px] leading-[1.15] text-[#1B1E29] sm:text-[32px]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            Write your first lesson.
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6E6A5F]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#B08A2E] hover:underline">
              Log in instead
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="Name">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Avery"
                className={inputClass}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>

            <Field label="Photo URL" optional>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#12141C]/5 ring-1 ring-[#12141C]/10">
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <span className="text-[13px] text-[#9BA0AF]">＋</span>
                  )}
                </div>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className={inputClass}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9587] hover:text-[#1B1E29]"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <ul className="mt-2.5 flex flex-col gap-1.5">
                {passwordChecks.map((rule) => (
                  <li key={rule.key} className="flex items-center gap-2 text-[12.5px]">
                    <span
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                        rule.passed ? "bg-[#B08A2E] text-white" : "bg-[#12141C]/10 text-transparent",
                      ].join(" ")}
                    >
                      <CheckIcon />
                    </span>
                    <span className={rule.passed ? "text-[#6E6A5F]" : "text-[#9B9587]"}>
                      {rule.label}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>

            {error && (
              <p className="rounded-lg bg-[#E2685C]/10 px-3 py-2 text-[13px] text-[#B5473C]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              isDisabled={!canSubmit}
              radius="full"
              className="mt-1 h-11 bg-[#12141C] font-semibold text-[#F5F1E8] hover:bg-[#1B1E29] disabled:opacity-40 transition-colors"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#12141C]/10" />
            <span className="text-[12px] text-[#9B9587]">or</span>
            <div className="h-px flex-1 bg-[#12141C]/10" />
          </div>

          <Button
            type="button"
            onClick={handleGoogle}
            isDisabled={googleLoading}
            radius="full"
            variant="bordered"
            className="h-11 w-full gap-2.5 border-[#12141C]/15 font-medium text-[#1B1E29] hover:bg-[#12141C]/[0.03]"
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, optional, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#4A473E]">
        {label}
        {optional && <span className="text-[#9B9587]"> (optional)</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#12141C]/12 bg-white/60 px-3.5 py-2.5 text-[14.5px] text-[#1B1E29] placeholder:text-[#B3AFA3] outline-none transition-colors focus:border-[#B08A2E]/60 focus:bg-white";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 17 17 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6.2 4.8 9 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A9.001 9.001 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}