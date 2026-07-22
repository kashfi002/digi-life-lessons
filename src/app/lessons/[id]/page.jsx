"use client";

/**
 * Lesson Details — /lessons/[id]
 * -----------------------------------------------------------------------
 * Fetches from the backend's GET /api/lessons/:id (which also returns
 * authorLessonCount, a deterministic "views" number, and whether *this*
 * viewer already liked/saved it). Comments are fetched separately.
 *
 * Premium gate: if the lesson is Premium and the viewer isn't (and
 * isn't the creator), the whole content area blurs with a lock overlay
 * and a button to /pricing — same pattern as LessonCard, just full-page.
 *
 * Like/Favorite are optimistic: the UI updates immediately, then
 * reconciles with the server response, and rolls back on failure.
 *
 * Install: npm install react-share
 * (used only for the Share button; everything else has no new deps)
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { FacebookShareButton, LinkedinShareButton, TwitterShareButton } from "react-share";

const REPORT_REASONS = [
  "Inappropriate content",
  "Spam",
  "Harassment",
  "False information",
  "Other",
];

export default function LessonDetailsPage({ params }) {
  // Next.js 15+ passes `params` as a Promise even in Client Component
  // pages (they can't be async functions), so React's use() unwraps it.
  const { id } = use(params);
  const { data: session, isPending: sessionPending } = useSession();
  const currentUser = session?.user;

  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const { toasts, pushToast } = useToasts();

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Wait for the session to settle before fetching, so the ?userId=
  // query actually reflects whether someone's logged in.
  useEffect(() => {
    if (sessionPending) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const userIdParam = currentUser?.id ? `?userId=${currentUser.id}` : "";
        const [lessonRes, commentsRes] = await Promise.all([
          fetch(`${API}/api/lessons/${id}${userIdParam}`),
          fetch(`${API}/api/lessons/${id}/comments`),
        ]);

        if (!lessonRes.ok) {
          const body = await lessonRes.json().catch(() => ({}));
          throw new Error(body.error || "Couldn't load this lesson.");
        }

        const lessonData = await lessonRes.json();
        const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [] };

        if (cancelled) return;
        setData(lessonData);
        setLiked(lessonData.viewerHasLiked);
        setLikesCount(lessonData.lesson.likesCount || 0);
        setSaved(lessonData.viewerHasSaved);
        setFavoritesCount(lessonData.lesson.favoritesCount || 0);
        setComments(commentsData.comments || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, sessionPending, currentUser?.id]);

  if (loading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#12141C] px-5 text-center">
        <p className="text-[16px] text-[#ECEAE3]">{error || "Lesson not found."}</p>
        <Link href="/public-lessons" className="text-[14px] font-medium text-[#F2C14E] hover:underline">
          ← Back to Public Lessons
        </Link>
      </main>
    );
  }

  const { lesson, authorLessonCount, views } = data;
  const isOwner = currentUser?.id === lesson.creatorId;
  const viewerIsPremium = Boolean(currentUser?.isPremium);
  const isLocked = lesson.accessLevel === "Premium" && !viewerIsPremium && !isOwner;

  const readingMinutes = Math.max(1, Math.round(lesson.description.trim().split(/\s+/).length / 200));

  const handleLike = async () => {
    if (!currentUser) {
      pushToast("error", "Please log in to like this lesson.");
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => Math.max(c + (wasLiked ? -1 : 1), 0));
    try {
      const res = await fetch(`${API}/api/lessons/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => Math.max(c + (wasLiked ? 1 : -1), 0));
      pushToast("error", "Couldn't update like. Try again.");
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) {
      pushToast("error", "Please log in to save this lesson.");
      return;
    }
    const wasSaved = saved;
    setSaved(!wasSaved);
    setFavoritesCount((c) => Math.max(c + (wasSaved ? -1 : 1), 0));
    try {
      const res = await fetch(`${API}/api/lessons/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setSaved(result.saved);
    } catch {
      setSaved(wasSaved);
      setFavoritesCount((c) => Math.max(c + (wasSaved ? 1 : -1), 0));
      pushToast("error", "Couldn't update favorites. Try again.");
    }
  };

  const handleReportSubmit = async () => {
    if (!currentUser) {
      pushToast("error", "Please log in to report a lesson.");
      return;
    }
    setSubmittingReport(true);
    try {
      const res = await fetch(`${API}/api/lessons/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterUserId: currentUser.id,
          reportedUserEmail: lesson.creatorEmail,
          reason: reportReason,
        }),
      });
      if (!res.ok) throw new Error();
      pushToast("success", "Lesson reported. Thank you.");
      setReportOpen(false);
    } catch {
      pushToast("error", "Couldn't submit the report. Try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API}/api/lessons/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userImage: currentUser.image,
          text: commentText,
        }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setComments((prev) => [result.comment, ...prev]);
      setCommentText("");
    } catch {
      pushToast("error", "Couldn't post your comment. Try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-screen bg-[#12141C] px-5 py-12 md:px-8 md:py-16">
      <ToastStack toasts={toasts} />

      <div className="mx-auto max-w-3xl">
        <Link href="/public-lessons" className="text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]">
          ← Back to Public Lessons
        </Link>

        {/* ---- 1. Lesson information + 2. Metadata (blurred if locked) ---- */}
        <div className="relative mt-5 overflow-hidden rounded-2xl">
          <div className={isLocked ? "pointer-events-none select-none blur-[8px]" : ""}>
            <LessonInfo lesson={lesson} readingMinutes={readingMinutes} />
          </div>

          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#12141C]/70 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2C14E]/20">
                <LockIcon />
              </div>
              <p className="text-[16px] font-medium text-white">This is a Premium lesson</p>
              <p className="max-w-xs text-[13.5px] text-white/70">
                Upgrade to Premium to read the full story and support the people who write them.
              </p>
              <Link
                href="/pricing"
                className="mt-1 rounded-full bg-[#F2C14E] px-6 py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
              >
                Upgrade to Premium
              </Link>
            </div>
          )}
        </div>

        {/* ---- 3. Author card ---- */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5">
          {lesson.creatorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lesson.creatorImage}
              alt={lesson.creatorName}
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[18px] font-semibold text-[#F2C14E] ring-1 ring-white/10">
              {(lesson.creatorName || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-[#ECEAE3]">{lesson.creatorName}</p>
            <p className="text-[13px] text-[#9BA0AF]">
              {authorLessonCount} lesson{authorLessonCount === 1 ? "" : "s"} written
            </p>
          </div>
          <Link
            href={`/authors/${lesson.creatorId}`}
            className="shrink-0 whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-[13px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
          >
            View all lessons
          </Link>
        </div>

        {/* ---- 4. Stats ---- */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatBlock icon={<HeartIcon filled={liked} />} value={formatCompact(likesCount)} label="Likes" />
          <StatBlock icon={<BookmarkIcon filled={saved} />} value={formatCompact(favoritesCount)} label="Favorites" />
          <StatBlock icon={<EyeIcon />} value={formatCompact(views)} label="Views" />
        </div>

        {/* ---- 5. Interaction buttons ---- */}
        {!isLocked && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ActionButton onClick={handleFavorite} active={saved} icon={<BookmarkIcon filled={saved} />}>
              {saved ? "Saved" : "Save to Favorites"}
            </ActionButton>
            <ActionButton onClick={handleLike} active={liked} icon={<HeartIcon filled={liked} />}>
              {liked ? "Liked" : "Like"}
            </ActionButton>
            <ActionButton onClick={() => setReportOpen(true)} icon={<FlagIcon />}>
              Report
            </ActionButton>

            {shareUrl && (
              <div className="flex items-center gap-1.5">
                <FacebookShareButton url={shareUrl} quote={lesson.title}>
                  <ShareIconWrap><FacebookGlyph /></ShareIconWrap>
                </FacebookShareButton>
                <TwitterShareButton url={shareUrl} title={lesson.title}>
                  <ShareIconWrap><XGlyph /></ShareIconWrap>
                </TwitterShareButton>
                <LinkedinShareButton url={shareUrl} title={lesson.title}>
                  <ShareIconWrap><LinkedinGlyph /></ShareIconWrap>
                </LinkedinShareButton>
              </div>
            )}
          </div>
        )}

        {/* ---- 6. Comments ---- */}
        {!isLocked && (
          <div className="mt-10">
            <h2 className="text-[15px] font-semibold text-[#ECEAE3]">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>

            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts on this lesson…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-[#ECEAE3] placeholder:text-[#5C6070] outline-none transition-colors focus:border-[#F2C14E]/50"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="self-end rounded-full bg-[#F2C14E] px-5 py-2 text-[13.5px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C] disabled:opacity-50"
                >
                  {submittingComment ? "Posting…" : "Post comment"}
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-white/10 px-4 py-3 text-[13.5px] text-[#9BA0AF]">
                <Link href="/login" className="font-medium text-[#F2C14E] hover:underline">
                  Log in
                </Link>{" "}
                to leave a comment.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-4">
              {comments.length === 0 ? (
                <p className="text-[13.5px] text-[#6E7280]">No comments yet — be the first.</p>
              ) : (
                comments.map((c) => <CommentItem key={c._id} comment={c} />)
              )}
            </div>
          </div>
        )}
      </div>

      {reportOpen && (
        <ReportModal
          reason={reportReason}
          onReasonChange={setReportReason}
          onCancel={() => setReportOpen(false)}
          onConfirm={handleReportSubmit}
          submitting={submittingReport}
        />
      )}
    </main>
  );
}

/* ---------------------------------------------------------------------- */

function LessonInfo({ lesson, readingMinutes }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{lesson.category}</Badge>
        <Badge tone>{lesson.emotionalTone}</Badge>
        <Badge accessLevel>{lesson.accessLevel === "Premium" ? "Premium" : "Free"}</Badge>
      </div>

      <h1
        className="mt-4 text-[26px] leading-tight text-[#ECEAE3] sm:text-[32px]"
        style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
      >
        {lesson.title}
      </h1>

      {lesson.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lesson.image}
          alt={lesson.title}
          className="mt-5 max-h-[360px] w-full rounded-xl object-cover"
        />
      )}

      <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-[#C7C9D1]">
        {lesson.description}
      </p>

      {/* Metadata block */}
      <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[13px] sm:grid-cols-4">
        <MetaItem label="Created" value={formatDate(lesson.createdAt)} />
        <MetaItem label="Updated" value={formatDate(lesson.updatedAt)} />
        <MetaItem label="Visibility" value={lesson.visibility} />
        <MetaItem label="Reading time" value={`${readingMinutes} min`} />
      </div>
    </div>
  );
}

function Badge({ children, tone, accessLevel }) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        accessLevel && children === "Premium"
          ? "bg-[#F2C14E]/15 text-[#F2C14E]"
          : "bg-white/[0.06] text-[#9BA0AF]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[#6E7280]">{label}</p>
      <p className="mt-0.5 font-medium text-[#ECEAE3]">{value}</p>
    </div>
  );
}

function StatBlock({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04]">
        {icon}
      </div>
      <div>
        <p className="text-[16px] font-semibold leading-none text-[#ECEAE3]">{value}</p>
        <p className="mt-0.5 text-[11.5px] text-[#9BA0AF]">{label}</p>
      </div>
    </div>
  );
}

function ActionButton({ children, icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors",
        active
          ? "border-[#F2C14E]/40 bg-[#F2C14E]/10 text-[#F2C14E]"
          : "border-white/10 text-[#ECEAE3] hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function ShareIconWrap({ children }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#9BA0AF] transition-colors hover:border-[#F2C14E]/40 hover:text-[#F2C14E]">
      {children}
    </span>
  );
}

function CommentItem({ comment }) {
  return (
    <div className="flex gap-3">
      {comment.userImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.userImage} alt={comment.userName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[12px] font-semibold text-[#9BA0AF]">
          {(comment.userName || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1 rounded-xl bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13.5px] font-medium text-[#ECEAE3]">{comment.userName}</p>
          <p className="shrink-0 text-[11px] text-[#6E7280]">{formatDate(comment.createdAt)}</p>
        </div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#C7C9D1]">{comment.text}</p>
      </div>
    </div>
  );
}

function ReportModal({ reason, onReasonChange, onCancel, onConfirm, submitting }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">Report this lesson?</h3>
        <p className="mt-1.5 text-[13px] text-[#9BA0AF]">
          Let us know why — our team will take a look.
        </p>
        <select
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-4 w-full appearance-none rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-[#ECEAE3] outline-none focus:border-[#F2C14E]/50"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r} className="bg-[#1B1E29]">
              {r}
            </option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-full bg-[#E2685C] px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#EA7C71] disabled:opacity-50"
          >
            {submitting ? "Reporting…" : "Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[#12141C] px-5 py-16">
      <div className="mx-auto max-w-3xl animate-pulse space-y-5">
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
        <div className="h-72 rounded-2xl bg-white/[0.04]" />
        <div className="h-20 rounded-2xl bg-white/[0.04]" />
        <div className="h-16 rounded-2xl bg-white/[0.04]" />
      </div>
    </main>
  );
}

/* ---- helpers ---- */

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return String(num);
}

/* ---- self-contained toast system, same pattern as Add Lesson ---- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, message) => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 3500);
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
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ---- icons ---- */

function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill={filled ? "#F2C14E" : "none"}>
      <path
        d="M10 17s-6.5-4-6.5-9A3.7 3.7 0 0 1 10 5.8 3.7 3.7 0 0 1 16.5 8c0 5-6.5 9-6.5 9Z"
        stroke={filled ? "#F2C14E" : "currentColor"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BookmarkIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill={filled ? "#F2C14E" : "none"}>
      <path
        d="M5 3h10a1 1 0 0 1 1 1v13l-6-3.5L4 17V4a1 1 0 0 1 1-1Z"
        stroke={filled ? "#F2C14E" : "currentColor"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M5 17V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 4h9l-2.2 3L14 10H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
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
function FacebookGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3l7.5 9.6L3.4 21H6l6-6.6 4.8 6.6H21l-8-10.2L20.2 3h-2.6l-5.5 6-4.4-6H3Z" />
    </svg>
  );
}
function LinkedinGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM20.44 20h-3.37v-5.9c0-1.4-.03-3.2-1.95-3.2-1.96 0-2.26 1.5-2.26 3.1V20H9.5V8.5h3.24v1.57h.05c.45-.85 1.56-1.74 3.2-1.74 3.42 0 4.05 2.25 4.05 5.17V20Z" />
    </svg>
  );
}