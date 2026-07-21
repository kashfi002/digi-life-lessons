"use client";

/**
 * Public Lessons — /public-lessons
 * -----------------------------------------------------------------------
 * Fetches from the separate backend (NEXT_PUBLIC_API_URL), not the
 * Next.js app itself. Open to everyone, logged in or not — session is
 * only read here to decide whether Premium cards should render locked
 * for *this* viewer.
 *
 * Not included yet, on purpose (you only asked for the card + listing):
 * search / filter / sort (Challenge 1) and pagination (Challenge 3).
 * Both slot in above the grid once you're ready — say the word and
 * I'll add them on top of this.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import LessonCard from "@/components/LessonCard";

export default function PublicLessonsPage() {
  const { data: session } = useSession();
  const viewerIsPremium = Boolean(session?.user?.isPremium);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lessons`);
        if (!res.ok) throw new Error("Couldn't load lessons right now.");
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
  }, []);

  return (
    <main className="min-h-screen bg-[#12141C] px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">
          THE ARCHIVE
        </span>
        <h1
          className="mt-3 text-[30px] leading-tight text-[#ECEAE3] sm:text-[36px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Lessons from everyone.
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#9BA0AF]">
          Every public lesson the community has shared, newest first.
        </p>

        {error && (
          <p className="mt-8 rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">
            {error}
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : lessons.map((lesson) => (
                <LessonCard key={lesson._id} lesson={lesson} viewerIsPremium={viewerIsPremium} />
              ))}
        </div>

        {!loading && !error && lessons.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-16 text-center">
            <p className="text-[15px] text-[#9BA0AF]">No public lessons yet.</p>
            <p className="text-[13px] text-[#6E7280]">
              Be the first to share one from your dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function CardSkeleton() {
  return (
    <div className="h-[300px] animate-pulse rounded-2xl bg-white/[0.04]" />
  );
}