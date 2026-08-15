"use client";

/**
 * Reported Lessons — /dashboard/admin/reported-lessons
 * -----------------------------------------------------------------------
 * One row per REPORTED LESSON (not per individual report) — the report
 * count and the "view reasons" modal are how individual reports surface.
 * Delete removes the lesson entirely; Ignore just clears its reports and
 * leaves the lesson live, per the PDF's exact wording for both actions.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function ReportedLessonsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [reportedLessons, setReportedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalTarget, setModalTarget] = useState(null); // reported-lesson group, for "view reasons"
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ignoreTarget, setIgnoreTarget] = useState(null);
  const [actioning, setActioning] = useState(false);
  const { toasts, pushToast } = useToasts();

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/reports?adminId=${session.user.id}`);
      if (!res.ok) throw new Error("Couldn't load reported lessons.");
      const data = await res.json();
      setReportedLessons(data.reportedLessons || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionPending) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPending, session?.user?.id]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActioning(true);
    try {
      const res = await fetch(`${API}/api/admin/reports/${deleteTarget.lessonId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id }),
      });
      if (!res.ok) throw new Error();
      setReportedLessons((prev) => prev.filter((r) => r.lessonId !== deleteTarget.lessonId));
      pushToast("success", "Lesson deleted.");
      setDeleteTarget(null);
    } catch {
      pushToast("error", "Couldn't delete the lesson. Try again.");
    } finally {
      setActioning(false);
    }
  };

  const handleIgnoreConfirm = async () => {
    if (!ignoreTarget) return;
    setActioning(true);
    try {
      const res = await fetch(`${API}/api/admin/reports/${ignoreTarget.lessonId}/ignore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id }),
      });
      if (!res.ok) throw new Error();
      setReportedLessons((prev) => prev.filter((r) => r.lessonId !== ignoreTarget.lessonId));
      pushToast("success", "Reports cleared. Lesson stays live.");
      setIgnoreTarget(null);
    } catch {
      pushToast("error", "Couldn't clear reports. Try again.");
    } finally {
      setActioning(false);
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
          Reported lessons.
        </h1>
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#1B1E29]">
        <table className="w-full min-w-[680px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#9BA0AF]">
              <th className="px-4 py-3 font-medium">Lesson</th>
              <th className="px-4 py-3 font-medium">Report count</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : reportedLessons.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-14 text-center text-[#9BA0AF]">
                  Nothing reported. All clear. 🎉
                </td>
              </tr>
            ) : (
              reportedLessons.map((group) => (
                <tr key={group.lessonId} className="border-b border-white/[0.04] last:border-0">
                  <td className="max-w-[280px] px-4 py-3">
                    <p className="truncate font-medium text-[#ECEAE3]">{group.lessonTitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#E2685C]/15 px-2.5 py-1 text-[11px] font-medium text-[#E2685C]">
                      🚩 {group.reportCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModalTarget(group)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
                      >
                        View reasons
                      </button>
                      <button
                        onClick={() => setIgnoreTarget(group)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#9BA0AF] transition-colors hover:bg-white/[0.06] hover:text-[#ECEAE3]"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={() => setDeleteTarget(group)}
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

      {modalTarget && (
        <ReasonsModal group={modalTarget} onClose={() => setModalTarget(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete this lesson?"
          body={
            <>
              <span className="font-medium text-[#ECEAE3]">"{deleteTarget.lessonTitle}"</span> will
              be permanently removed, along with its likes, favorites, comments, and reports. This
              can't be undone.
            </>
          }
          confirmLabel="Delete permanently"
          confirmingLabel="Deleting…"
          danger
          actioning={actioning}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {ignoreTarget && (
        <ConfirmModal
          title="Ignore these reports?"
          body={
            <>
              <span className="font-medium text-[#ECEAE3]">"{ignoreTarget.lessonTitle}"</span> stays
              live and all {ignoreTarget.reportCount} report{ignoreTarget.reportCount === 1 ? "" : "s"}{" "}
              on it will be cleared.
            </>
          }
          confirmLabel="Ignore reports"
          confirmingLabel="Clearing…"
          actioning={actioning}
          onCancel={() => setIgnoreTarget(null)}
          onConfirm={handleIgnoreConfirm}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function ReasonsModal({ group, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#ECEAE3]">{group.lessonTitle}</h3>
            <p className="mt-0.5 text-[12.5px] text-[#9BA0AF]">
              {group.reportCount} report{group.reportCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#9BA0AF] hover:bg-white/[0.06] hover:text-[#ECEAE3]"
          >
            <CloseGlyph />
          </button>
        </div>

        <div className="mt-4 flex max-h-[320px] flex-col gap-2.5 overflow-y-auto">
          {group.reports.map((r, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <p className="text-[13.5px] font-medium text-[#ECEAE3]">{r.reason}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#9BA0AF]">
                {r.reportedUserEmail && <span>Reported: {r.reportedUserEmail}</span>}
                <span>{formatDateTime(r.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, confirmingLabel, danger, actioning, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">{title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#9BA0AF]">{body}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actioning}
            className={[
              "rounded-full px-5 py-2 text-[13.5px] font-semibold text-white transition-colors disabled:opacity-50",
              danger ? "bg-[#E2685C] hover:bg-[#EA7C71]" : "bg-[#F2C14E] text-[#12141C] hover:bg-[#F6CD6C]",
            ].join(" ")}
          >
            {actioning ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M4 4l12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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