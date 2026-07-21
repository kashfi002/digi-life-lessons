"use client";

/**
 * Add Lesson — /dashboard/add-lesson
 * -----------------------------------------------------------------------
 * Frontend-only for now, per your call — this POSTs to /api/lessons,
 * which doesn't exist yet. Everything else (validation, the Premium
 * gate, loading state, toasts) is fully working already.
 *
 * Expected payload shape (creatorId/createdAt are added server-side,
 * not sent from here):
 *   {
 *     title: string,
 *     description: string,
 *     category: "Personal Growth" | "Career" | "Relationships" | "Mindset" | "Mistakes Learned",
 *     emotionalTone: "Motivational" | "Sad" | "Realization" | "Gratitude",
 *     image: string | null,
 *     visibility: "Public" | "Private",
 *     accessLevel: "Free" | "Premium",
 *   }
 *
 * Access Level rule (from the PDF): only Premium users can pick
 * "Premium" — the option is disabled with a tooltip for everyone else,
 * and the value is force-reset to "Free" if it somehow isn't.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

const CATEGORIES = ["Personal Growth", "Career", "Relationships", "Mindset", "Mistakes Learned"];
const TONES = ["Motivational", "Sad", "Realization", "Gratitude"];

export default function AddLessonPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isPremium = Boolean(session?.user?.isPremium);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [image, setImage] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [accessLevel, setAccessLevel] = useState("Free");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { toasts, pushToast } = useToasts();

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = "Give your lesson a title.";
    if (!description.trim() || description.trim().length < 20)
      next.description = "Write at least a couple of sentences (20+ characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!session?.user) {
      pushToast("error", "You need to be logged in to publish a lesson.");
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          emotionalTone: tone,
          image: image.trim() || null,
          visibility,
          // defensive: never send "Premium" for a non-premium user, even
          // if client state somehow got out of sync with the disabled UI
          accessLevel: isPremium ? accessLevel : "Free",

          // who's posting it — read from the current session.
          // TEMPORARY: the backend currently trusts these fields as-is.
          // Once token verification (Challenge 2) is in place, the
          // backend should confirm this independently instead.
          creatorId: session.user.id,
          creatorName: session.user.name,
          creatorEmail: session.user.email,
          creatorImage: session.user.image || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't publish the lesson. Try again.");
      }

      pushToast("success", "Lesson published!");
      router.push("/dashboard/my-lessons");
    } catch (err) {
      pushToast("error", err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} />

      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">CREATE</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Write a new lesson.
        </h1>
        <p className="mt-1.5 text-[14px] text-[#9BA0AF]">
          Say what happened, what it taught you, and what you'd tell someone about to learn it the hard way.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-8"
      >
        <Field label="Lesson title" error={errors.title}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Rest is not the opposite of progress"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={setCategory} options={CATEGORIES} />
          </Field>
          <Field label="Emotional tone">
            <Select value={tone} onChange={setTone} options={TONES} />
          </Field>
        </div>

        <Field label="Full description / story / insight" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Tell the story behind the lesson — what happened, and what it taught you…"
            className={inputClass + " resize-y leading-relaxed"}
          />
          <p className="mt-1 text-right text-[12px] text-[#6E7280]">
            {description.trim().length} characters
          </p>
        </Field>

        <Field label="Image URL" optional>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <span className="text-[11px] text-[#6E7280]">none</span>
              )}
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className={inputClass}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Visibility">
            <SegmentedControl
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "Public", label: "Public" },
                { value: "Private", label: "Private" },
              ]}
            />
          </Field>

          <Field label="Access level">
            <SegmentedControl
              value={isPremium ? accessLevel : "Free"}
              onChange={setAccessLevel}
              options={[
                { value: "Free", label: "Free" },
                {
                  value: "Premium",
                  label: "Premium",
                  disabled: !isPremium,
                  tooltip: "Upgrade to Premium to create paid lessons.",
                },
              ]}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full px-5 py-2.5 text-[14px] font-medium text-[#9BA0AF] transition-colors hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#F2C14E] px-6 py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C] disabled:opacity-50"
          >
            {submitting ? "Publishing…" : "Publish lesson"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function Field({ label, optional, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#ECEAE3]">
        {label}
        {optional && <span className="text-[#6E7280]"> (optional)</span>}
      </span>
      {children}
      {error && <span className="text-[12.5px] text-[#E2685C]">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14.5px] text-[#ECEAE3] placeholder:text-[#5C6070] outline-none transition-colors focus:border-[#F2C14E]/50 focus:bg-white/[0.05]";

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass + " appearance-none pr-9"}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1B1E29] text-[#ECEAE3]">
            {opt}
          </option>
        ))}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7280]"
      >
        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.disabled ? opt.tooltip : undefined}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={[
              "rounded-md px-4 py-1.5 text-[13.5px] font-medium transition-colors",
              opt.disabled
                ? "cursor-not-allowed text-[#4A4E5C]"
                : active
                ? "bg-[#F2C14E] text-[#12141C]"
                : "text-[#9BA0AF] hover:text-[#ECEAE3]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Minimal self-contained toast system (no alert(), per the spec) ---- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };
  return { toasts, pushToast };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13.5px] font-medium shadow-lg backdrop-blur-sm",
            t.type === "success"
              ? "border-[#F2C14E]/25 bg-[#1B1E29]/95 text-[#F2C14E]"
              : "border-[#E2685C]/25 bg-[#1B1E29]/95 text-[#E2685C]",
          ].join(" ")}
        >
          {t.type === "success" ? <CheckGlyph /> : <ErrorGlyph />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.8 8.2l2 2 4-4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ErrorGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5v4.2M8 11.2v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}