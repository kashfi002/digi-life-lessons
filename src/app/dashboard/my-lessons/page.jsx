"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function MyLessonsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const isPremium = Boolean(session?.user?.isPremium);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, pushToast } = useToasts();

  useEffect(() => {
    if (sessionPending || !session?.user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/lessons/mine?userId=${session.user.id}`);
        if (!res.ok) throw new Error("Couldn't load your lessons.");
        const data = await res.json();
        if (!cancelled) setLessons(data.lessons || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionPending, session?.user?.id]);

  const updateLessonLocal = (id, patch) => {
    setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  };

  const handleVisibilityChange = async (lesson, visibility) => {
    if (visibility === lesson.visibility) return;
    const prevValue = lesson.visibility;
    updateLessonLocal(lesson._id, { visibility });
    try {
      const res = await fetch(`${API}/lessons/${lesson._id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, visibility }),
      });
      if (!res.ok) throw new Error();
      pushToast("success", `Lesson set to ${visibility}.`);
    } catch {
      updateLessonLocal(lesson._id, { visibility: prevValue });
      pushToast("error", "Couldn't update visibility.");
    }
  };

  const handleAccessLevelChange = async (lesson, accessLevel) => {
    if (accessLevel === lesson.accessLevel) return;
    const prevValue = lesson.accessLevel;
    updateLessonLocal(lesson._id, { accessLevel });
    try {
      const res = await fetch(`${API}/lessons/${lesson._id}/access-level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, isPremium, accessLevel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }
      pushToast("success", `Access level set to ${accessLevel}.`);
    } catch (err) {
      updateLessonLocal(lesson._id, { accessLevel: prevValue });
      pushToast("error", err.message || "Couldn't update access level.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/lessons/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">MY LESSONS</span>
          <h1
            className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            Everything you've written.
          </h1>
        </div>
        <Link
          href="/dashboard/add-lesson"
          className="rounded-full bg-[#F2C14E] px-5 py-2.5 text-[14px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
        >
          + New lesson
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#1B1E29]">
        <table className="w-full min-w-[840px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#9BA0AF]">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Likes</th>
              <th className="px-4 py-3 font-medium">Saves</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : lessons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-[#9BA0AF]">
                  You haven't written a lesson yet.{" "}
                  <Link href="/dashboard/add-lesson" className="font-medium text-[#F2C14E] hover:underline">
                    Write your first one →
                  </Link>
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson._id} className="border-b border-white/[0.04] last:border-0">
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-[#ECEAE3]">{lesson.title}</p>
                    <p className="truncate text-[12px] text-[#6E7280]">{lesson.category}</p>
                  </td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{formatDate(lesson.createdAt)}</td>
                  <td className="px-4 py-3">
                    <MiniToggle
                      value={lesson.visibility}
                      options={[
                        { value: "Public", label: "Public" },
                        { value: "Private", label: "Private" },
                      ]}
                      onChange={(v) => handleVisibilityChange(lesson, v)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MiniToggle
                      value={lesson.accessLevel || "Free"}
                      options={[
                        { value: "Free", label: "Free" },
                        {
                          value: "Premium",
                          label: "Premium",
                          disabled: !isPremium,
                          tooltip: "Upgrade to Premium to create paid lessons.",
                        },
                      ]}
                      onChange={(v) => handleAccessLevelChange(lesson, v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.likesCount || 0}</td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.favoritesCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/lessons/${lesson._id}`}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/dashboard/my-lessons/${lesson._id}/edit`}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
                      >
                        Update
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

function MiniToggle({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
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
              "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
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

function DeleteModal({ lesson, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">Delete this lesson?</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#9BA0AF]">
          <span className="font-medium text-[#ECEAE3]">"{lesson.title}"</span> will be permanently
          removed, along with its likes, favorites, and comments. This can't be undone.
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

/* ---- helpers ---- */

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---- self-contained toast system, same pattern as Add Lesson ---- */

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