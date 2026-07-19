
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export default function DashboardHomePage() {
  const { data: session, isPending } = useSession();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;

    (async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  if (isPending) {
    return <PageSkeleton />;
  }

  const user = session?.user;
  const isPremium = user?.isPremium;

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">
            DASHBOARD
          </span>
          <h1
            className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            Welcome back, {firstName(user?.name) || "friend"}.
          </h1>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-3 py-1 text-[12px] font-medium tracking-wide",
            isPremium
              ? "bg-[#F2C14E]/15 text-[#F2C14E]"
              : "bg-white/[0.06] text-[#9BA0AF]",
          ].join(" ")}
        >
          {isPremium ? "PREMIUM ⭐" : "FREE PLAN"}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">
          {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Lessons created"
          value={summary?.totalLessons}
          loading={loadingSummary}
          icon={<StackGlyph />}
        />
        <StatCard
          label="Saved to favorites"
          value={summary?.totalFavorites}
          loading={loadingSummary}
          icon={<BookmarkGlyph />}
        />
        <StatCard
          label="This week"
          value={summary?.weeklyActivity?.reduce((sum, d) => sum + d.count, 0)}
          loading={loadingSummary}
          icon={<SparkGlyph />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recently added lessons */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-[#ECEAE3]">Recently added</h2>
          <div className="mt-4 flex flex-col gap-2">
            {loadingSummary ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
              ))
            ) : summary?.recentLessons?.length ? (
              summary.recentLessons.map((lesson) => (
                <RecentLessonRow key={lesson.id} lesson={lesson} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Weekly activity chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-[#ECEAE3]">This week's activity</h2>
          <p className="mt-1 text-[13px] text-[#9BA0AF]">Lessons written per day</p>
          <div className="mt-4 h-[180px]">
            {loadingSummary ? (
              <div className="h-full animate-pulse rounded-xl bg-white/[0.04]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.weeklyActivity || []}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#9BA0AF", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(242,193,78,0.08)" }}
                    contentStyle={{
                      background: "#12141C",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#ECEAE3",
                    }}
                  />
                  <Bar dataKey="count" fill="#F2C14E" radius={[5, 5, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-[#ECEAE3]">Quick shortcuts</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <ShortcutLink href="/dashboard/add-lesson" label="Add a lesson" icon={<PlusGlyph />} primary />
          <ShortcutLink href="/dashboard/my-lessons" label="My lessons" icon={<StackGlyph />} />
          <ShortcutLink href="/dashboard/my-favorites" label="My favorites" icon={<BookmarkGlyph />} />
          {!isPremium && (
            <ShortcutLink href="/pricing" label="Upgrade to Premium" icon={<CrownGlyph />} accent />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function firstName(name) {
  return name?.trim().split(" ")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, loading, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2C14E]/10 text-[#F2C14E]">
        {icon}
      </div>
      <div>
        <p className="text-[13px] text-[#9BA0AF]">{label}</p>
        {loading ? (
          <div className="mt-1 h-6 w-10 animate-pulse rounded bg-white/[0.06]" />
        ) : (
          <p
            className="mt-0.5 text-[24px] leading-none text-[#ECEAE3]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            {value ?? 0}
          </p>
        )}
      </div>
    </div>
  );
}

function RecentLessonRow({ lesson }) {
  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
    >
      <div className="min-w-0">
        <p className="truncate text-[14.5px] font-medium text-[#ECEAE3]">{lesson.title}</p>
        <p className="mt-0.5 text-[12.5px] text-[#9BA0AF]">
          {lesson.category} · {formatDate(lesson.createdAt)}
        </p>
      </div>
      <span
        className={[
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
          lesson.accessLevel === "Premium"
            ? "bg-[#F2C14E]/15 text-[#F2C14E]"
            : "bg-white/[0.06] text-[#9BA0AF]",
        ].join(" ")}
      >
        {lesson.accessLevel || "Free"}
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
      <p className="text-[14px] text-[#9BA0AF]">You haven't written a lesson yet.</p>
      <Link
        href="/dashboard/add-lesson"
        className="text-[13.5px] font-medium text-[#F2C14E] hover:underline"
      >
        Write your first one →
      </Link>
    </div>
  );
}

function ShortcutLink({ href, label, icon, primary, accent }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-colors",
        primary
          ? "bg-[#F2C14E] text-[#12141C] hover:bg-[#F6CD6C]"
          : accent
          ? "border border-[#F2C14E]/30 text-[#F2C14E] hover:bg-[#F2C14E]/10"
          : "border border-white/10 text-[#ECEAE3] hover:bg-white/[0.05]",
      ].join(" ")}
    >
      {icon}
      {label}
    </Link>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-8 w-64 animate-pulse rounded bg-white/[0.06]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

/* ---- Tiny inline glyphs, currentColor ---- */

function StackGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6" y="10.5" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.6" />
    </svg>
  );
}
function BookmarkGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3.5L4 17V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function SparkGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.5 4.5l2.8 2.8M12.7 12.7l2.8 2.8M4.5 15.5l2.8-2.8M12.7 7.3l2.8-2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function PlusGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CrownGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M3 15h14l-1.2-7.5-3.6 3-2.2-5-2.2 5-3.6-3L3 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}