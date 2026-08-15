"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export default function AdminDashboardHomePage() {
  const { data: session } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/admin/stats?adminId=${session.user.id}`);
        if (!res.ok) throw new Error("Couldn't load admin stats.");
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">ADMIN</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Platform overview.
        </h1>
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats?.totalUsers} loading={loading} icon={<UsersGlyph />} />
        <StatCard label="Public lessons" value={stats?.totalPublicLessons} loading={loading} icon={<StackGlyph />} />
        <StatCard label="Reported lessons" value={stats?.totalReportedLessons} loading={loading} icon={<FlagGlyph />} accent="danger" />
        <StatCard label="Today's new lessons" value={stats?.todaysNewLessons} loading={loading} icon={<SparkGlyph />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Lesson growth" subtitle="New lessons per day, last 7 days" data={stats?.lessonGrowth} loading={loading} />
        <ChartCard title="User growth" subtitle="New signups per day, last 7 days" data={stats?.userGrowth} loading={loading} />
      </div>

      {/* Most active contributors */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-[#ECEAE3]">Most active contributors</h2>
        <div className="mt-4 flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
            ))
          ) : stats?.mostActiveContributors?.length ? (
            stats.mostActiveContributors.map((c) => <ContributorRow key={c._id} contributor={c} />)
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-[14px] text-[#9BA0AF]">
              No contributors yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function StatCard({ label, value, loading, icon, accent }) {
  const iconWrapClass =
    accent === "danger" ? "bg-[#E2685C]/10 text-[#E2685C]" : "bg-[#F2C14E]/10 text-[#F2C14E]";
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}>
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

function ChartCard({ title, subtitle, data, loading }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-[#ECEAE3]">{title}</h2>
      <p className="mt-1 text-[13px] text-[#9BA0AF]">{subtitle}</p>
      <div className="mt-4 h-[200px]">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-white/[0.04]" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []}>
              <XAxis dataKey="day" tick={{ fill: "#9BA0AF", fontSize: 12 }} axisLine={false} tickLine={false} />
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
  );
}

function ContributorRow({ contributor }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.04]">
      {contributor.creatorImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={contributor.creatorImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[13px] font-semibold text-[#F2C14E] ring-1 ring-white/10">
          {(contributor.creatorName || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <p className="flex-1 truncate text-[14px] font-medium text-[#ECEAE3]">
        {contributor.creatorName || "Anonymous"}
      </p>
      <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#9BA0AF]">
        {contributor.lessonCount} lessons
      </span>
    </div>
  );
}

/* ---- Tiny inline glyphs, currentColor ---- */

function UsersGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="7.2" cy="6.5" r="2.7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="7.5" r="2.1" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.6" />
      <path d="M2.5 17c.8-2.9 2.7-4.3 4.7-4.3s3.9 1.4 4.7 4.3M12.8 13.2c1.7.2 3 1.4 3.6 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function StackGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6" y="10.5" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.6" />
    </svg>
  );
}
function FlagGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 17V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 4h9l-2.2 3L14 10H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
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