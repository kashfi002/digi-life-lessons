"use client";

/**
 * Manage Lessons — /dashboard/admin/manage-lessons
 * -----------------------------------------------------------------------
 * All lessons, all users. Featured and Reviewed are independent
 * booleans (not a segmented either/or like Visibility elsewhere), so
 * they're plain toggle pills, not MiniToggle's two-option pattern.
 *
 * Delete here is the admin override — it bypasses the "only the owner
 * can delete" check that the regular DELETE /api/lessons/:id route
 * enforces, via the separate DELETE /api/admin/lessons/:id route.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

const CATEGORIES = ["Personal Growth", "Career", "Relationships", "Mindset", "Mistakes Learned"];

export default function ManageLessonsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState({ publicCount: 0, privateCount: 0, flaggedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("All");
  const [visibility, setVisibility] = useState("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, pushToast } = useToasts();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("adminId", session?.user?.id || "");
    if (category !== "All") params.set("category", category);
    if (visibility !== "All") params.set("visibility", visibility);
    if (flaggedOnly) params.set("flagged", "true");
    return params.toString();
  }, [session?.user?.id, category, visibility, flaggedOnly]);

  useEffect(() => {
    if (sessionPending || !session?.user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/admin/lessons?${queryString}`);
        if (!res.ok) throw new Error("Couldn't load lessons.");
        const data = await res.json();
        if (!cancelled) {
          setLessons(data.lessons || []);
          setStats(data.stats || { publicCount: 0, privateCount: 0, flaggedCount: 0 });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionPending, session?.user, queryString]);

  const updateLocal = (id, patch) => {
    setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  };

  const toggleFeatured = async (lesson) => {
    const next = !lesson.isFeatured;
    updateLocal(lesson._id, { isFeatured: next });
    try {
      const res = await fetch(`${API}/api/admin/lessons/${lesson._id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, isFeatured: next }),
      });
      if (!res.ok) throw new Error();
      pushToast("success", next ? "Marked as featured." : "Removed from featured.");
    } catch {
      updateLocal(lesson._id, { isFeatured: !next });
      pushToast("error", "Couldn't update featured status.");
    }
  };

  const toggleReviewed = async (lesson) => {
    const next = !lesson.isReviewed;
    updateLocal(lesson._id, { isReviewed: next });
    try {
      const res = await fetch(`${API}/api/admin/lessons/${lesson._id}/reviewed`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, isReviewed: next }),
      });
      if (!res.ok) throw new Error();
      pushToast("success", next ? "Marked as reviewed." : "Marked as unreviewed.");
    } catch {
      updateLocal(lesson._id, { isReviewed: !next });
      pushToast("error", "Couldn't update reviewed status.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/admin/lessons/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id }),
      });
      if (!res.ok) throw new Error();
      setLessons((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      pushToast("success", "Lesson deleted.");
      setDeleteTarget(null);
    } catch {
      pushToast("error", "Couldn't delete the lesson. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} />

      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">ADMIN</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Manage lessons.
        </h1>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label="Public lessons" value={stats.publicCount} />
        <MiniStat label="Private lessons" value={stats.privateCount} />
        <MiniStat label="Flagged / reported" value={stats.flaggedCount} accent="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect value={category} onChange={setCategory} options={["All", ...CATEGORIES]} />
        <FilterSelect value={visibility} onChange={setVisibility} options={["All", "Public", "Private"]} />
        <button
          type="button"
          onClick={() => setFlaggedOnly((v) => !v)}
          className={[
            "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
            flaggedOnly
              ? "border-[#E2685C]/40 bg-[#E2685C]/10 text-[#E2685C]"
              : "border-white/10 bg-white/[0.03] text-[#9BA0AF] hover:text-[#ECEAE3]",
          ].join(" ")}
        >
          🚩 Flagged only
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#1B1E29]">
        <table className="w-full min-w-[920px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#9BA0AF]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Reports</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Reviewed</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : lessons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-[#9BA0AF]">
                  No lessons match those filters.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson._id} className="border-b border-white/[0.04] last:border-0">
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-[#ECEAE3]">{lesson.title}</p>
                    <p className="truncate text-[12px] text-[#6E7280]">{lesson.category}</p>
                  </td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.creatorName || "Anonymous"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-medium",
                        lesson.visibility === "Public"
                          ? "bg-[#F2C14E]/15 text-[#F2C14E]"
                          : "bg-white/[0.06] text-[#9BA0AF]",
                      ].join(" ")}
                    >
                      {lesson.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lesson.reportCount > 0 ? (
                      <span className="rounded-full bg-[#E2685C]/15 px-2.5 py-1 text-[11px] font-medium text-[#E2685C]">
                        🚩 {lesson.reportCount}
                      </span>
                    ) : (
                      <span className="text-[#4A4E5C]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BoolToggle checked={Boolean(lesson.isFeatured)} onChange={() => toggleFeatured(lesson)} />
                  </td>
                  <td className="px-4 py-3">
                    <BoolToggle checked={Boolean(lesson.isReviewed)} onChange={() => toggleReviewed(lesson)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/lessons/${lesson._id}`}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(lesson)}
                        className="rounded-full border border-[#E2685C]/25 px-3 py-1.5 text-[12.5px] font-medium text-[#E2685C] transition-colors hover:bg-[#E2685C]/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteModal
          lesson={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function MiniStat({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5">
      <p className="text-[13px] text-[#9BA0AF]">{label}</p>
      <p
        className={[
          "mt-1 text-[22px] leading-none",
          accent === "danger" ? "text-[#E2685C]" : "text-[#ECEAE3]",
        ].join(" ")}
        style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
      >
        {value ?? 0}
      </p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-3.5 pr-9 text-[13.5px] text-[#ECEAE3] outline-none transition-colors focus:border-[#F2C14E]/50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1B1E29]">
            {opt}
          </option>
        ))}
      </select>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7280]">
        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function BoolToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-[#F2C14E]" : "bg-white/[0.1]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-[#12141C] transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function DeleteModal({ lesson, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">Delete this lesson?</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#9BA0AF]">
          <span className="font-medium text-[#ECEAE3]">"{lesson.title}"</span> by{" "}
          {lesson.creatorName || "Anonymous"} will be permanently removed, along with its likes,
          favorites, and comments. This can't be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-[#E2685C] px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#EA7C71] disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- self-contained toast system, same pattern as the other dashboard pages ---- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
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
            "rounded-xl border px-4 py-3 text-[13.5px] font-medium shadow-lg backdrop-blur-sm",
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