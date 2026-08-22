"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api-fetch";

const CATEGORIES = ["Personal Growth", "Career", "Relationships", "Mindset", "Mistakes Learned"];
const TONES = ["Motivational", "Sad", "Realization", "Gratitude"];

export default function MyFavoritesPage() {
  const { data: session, isPending: sessionPending } = useSession();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [tone, setTone] = useState("All");
  const [removingId, setRemovingId] = useState(null);
  const { toasts, pushToast } = useToasts();

  useEffect(() => {
    if (sessionPending || !session?.user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
       const res = await apiFetch(`/favorites/mine?userId=${session.user.id}`);
        if (!res.ok) throw new Error("Couldn't load your favorites.");
        const data = await res.json();
        if (!cancelled) setFavorites(data.favorites || []);
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

  const filtered = useMemo(() => {
    return favorites.filter((l) => {
      if (category !== "All" && l.category !== category) return false;
      if (tone !== "All" && l.emotionalTone !== tone) return false;
      return true;
    });
  }, [favorites, category, tone]);

  const handleRemove = async (lesson) => {
    setRemovingId(lesson._id);
    try {
      const res = await apiFetch(`/lessons/${lesson._id}/favorite`, {
  method: "POST",
  body: JSON.stringify({ userId: session.user.id }),
});
      if (!res.ok) throw new Error();
      setFavorites((prev) => prev.filter((l) => l._id !== lesson._id));
      pushToast("success", "Removed from favorites.");
    } catch {
      pushToast("error", "Couldn't remove from favorites. Try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const hasActiveFilters = category !== "All" || tone !== "All";

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} />

      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">SAVED</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Lessons you've saved.
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect value={category} onChange={setCategory} options={["All", ...CATEGORIES]} />
        <FilterSelect value={tone} onChange={setTone} options={["All", ...TONES]} />
        {hasActiveFilters && (
          <button
            onClick={() => {
              setCategory("All");
              setTone("All");
            }}
            className="text-[13px] font-medium text-[#F2C14E] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#1B1E29]">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#9BA0AF]">
              <th className="px-4 py-3 font-medium">Lesson</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Tone</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Saved</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-[#9BA0AF]">
                  {favorites.length === 0 ? (
                    <>
                      Nothing saved yet.{" "}
                      <Link href="/public-lessons" className="font-medium text-[#F2C14E] hover:underline">
                        Browse public lessons →
                      </Link>
                    </>
                  ) : (
                    "No saved lessons match those filters."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((lesson) => (
                <tr key={lesson._id} className="border-b border-white/[0.04] last:border-0">
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-[#ECEAE3]">{lesson.title}</p>
                    <AccessBadge accessLevel={lesson.accessLevel} />
                  </td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.category}</td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.emotionalTone}</td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{lesson.creatorName || "Anonymous"}</td>
                  <td className="px-4 py-3 text-[#9BA0AF]">{formatDate(lesson.savedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/lessons/${lesson._id}`}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleRemove(lesson)}
                        disabled={removingId === lesson._id}
                        className="rounded-full border border-[#E2685C]/25 px-3 py-1.5 text-[12.5px] font-medium text-[#E2685C] transition-colors hover:bg-[#E2685C]/10 disabled:opacity-50"
                      >
                        {removingId === lesson._id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

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

function AccessBadge({ accessLevel }) {
  return (
    <span
      className={[
        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium",
        accessLevel === "Premium" ? "bg-[#F2C14E]/15 text-[#F2C14E]" : "bg-white/[0.06] text-[#9BA0AF]",
      ].join(" ")}
    >
      {accessLevel === "Premium" ? "Premium" : "Free"}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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