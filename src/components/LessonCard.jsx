import Link from "next/link";

/**
 * LessonCard — Digital Life Lessons
 * -----------------------------------------------------------------------
 * Same paper-card material as the hero/auth pages, kept flat (no
 * rotation) since this one needs to hold a lot of real information
 * cleanly: category, tone, creator, date, access badge, and a CTA.
 *
 * Premium gating, straight from the PDF:
 *   "If lesson accessLevel is Premium and the current user is not
 *    Premium → show a blurred card with lock icon + 'Premium Lesson –
 *    Upgrade to view'."
 *
 * Pass `viewerIsPremium={false}` for logged-out visitors too — they
 * should see the same locked treatment as a free logged-in user.
 *
 * Note: line-clamp-2 / line-clamp-3 below need Tailwind v3.3+ (built in
 * core, no plugin required). If you're on an older Tailwind version,
 * install @tailwindcss/line-clamp instead.
 */

const TONE_DOT = {
  Motivational: "#F2C14E",
  Sad: "#7C93B3",
  Realization: "#6FAE8C",
  Gratitude: "#D98BA0",
};

function firstLetterOf(name, email) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LessonCard({ lesson, viewerIsPremium = false }) {
  const isLocked = lesson.accessLevel === "Premium" && !viewerIsPremium;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#F5F1E8] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <div className={isLocked ? "pointer-events-none blur-[7px] select-none" : ""}>
        <CardBody lesson={lesson} />
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#12141C]/55 px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2C14E]/20">
            <LockIcon />
          </div>
          <p className="text-[14.5px] font-medium text-white">Premium Lesson</p>
          <p className="text-[12.5px] text-white/70">Upgrade to view</p>
          <Link
            href="/pricing"
            className="mt-1 rounded-full bg-[#F2C14E] px-5 py-2 text-[13px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}

function CardBody({ lesson }) {
  return (
    <div className="flex h-full flex-col p-5">
      {/* Category + access badges */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#12141C]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#4A473E]">
          {lesson.category}
        </span>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-medium",
            lesson.accessLevel === "Premium"
              ? "bg-[#F2C14E]/20 text-[#8A6A1F]"
              : "bg-[#12141C]/[0.06] text-[#6E6A5F]",
          ].join(" ")}
        >
          {lesson.accessLevel === "Premium" ? "Premium" : "Free"}
        </span>
      </div>

      {/* Title */}
      <h3
        className="mt-3 line-clamp-2 text-[19px] leading-snug text-[#1B1E29]"
        style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
      >
        {lesson.title}
      </h3>

      {/* Description preview */}
      <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-[#6E6A5F]">
        {lesson.description}
      </p>

      {/* Emotional tone */}
      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6E6A5F]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: TONE_DOT[lesson.emotionalTone] || "#9B9587" }}
        />
        {lesson.emotionalTone}
      </div>

      {/* Creator + date */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#12141C]/[0.07] pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {lesson.creatorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lesson.creatorImage}
              alt={lesson.creatorName || "Creator"}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#12141C]/10 text-[11px] font-semibold text-[#4A473E]">
              {firstLetterOf(lesson.creatorName, lesson.creatorEmail)}
            </div>
          )}
          <span className="truncate text-[12.5px] font-medium text-[#4A473E]">
            {lesson.creatorName || "Anonymous"}
          </span>
        </div>
        <span className="shrink-0 text-[11.5px] text-[#9B9587]">{formatDate(lesson.createdAt)}</span>
      </div>

      {/* CTA */}
      <Link
        href={`/lessons/${lesson._id}`}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-[#12141C] py-2.5 text-[13.5px] font-semibold text-[#F5F1E8] transition-colors hover:bg-[#1B1E29]"
      >
        See details
      </Link>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" stroke="#F2C14E" strokeWidth="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="#F2C14E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}