"use client";

/**
 * Public Lessons — /public-lessons
 * -----------------------------------------------------------------------
 * Challenge 1 (search + filter + sort) and Challenge 3 (pagination),
 * both handled server-side by the backend's GET /api/lessons — this
 * page just builds the query string and re-fetches whenever a control
 * changes. Nothing is filtered client-side, so this scales past a
 * handful of test lessons.
 *
 * Filters reset the page back to 1 automatically (changing category
 * while on page 3 with no results would be a confusing dead end
 * otherwise). Search is debounced 400ms so it doesn't fire a request
 * on every keystroke.
 */

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import LessonCard from "@/components/LessonCard";

const CATEGORIES = ["Personal Growth", "Career", "Relationships", "Mindset", "Mistakes Learned"];
const TONES = ["Motivational", "Sad", "Realization", "Gratitude"];
const PAGE_SIZE = 6;

export default function PublicLessonsPage() {
  const { data: session } = useSession();
  const viewerIsPremium = Boolean(session?.user?.isPremium);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tone, setTone] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [lessons, setLessons] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search box → committed `search` state
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change (not page itself) jumps back to page 1
  useEffect(() => {
    setPage(1);
  }, [search, category, tone, sort]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "All") params.set("category", category);
    if (tone !== "All") params.set("tone", tone);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    return params.toString();
  }, [search, category, tone, sort, page]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lessons?${queryString}`);
        if (!res.ok) throw new Error("Couldn't load lessons right now.");
        const data = await res.json();
        if (!cancelled) {
          setLessons(data.lessons || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
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
  }, [queryString]);

  const hasActiveFilters = search || category !== "All" || tone !== "All";

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("All");
    setTone("All");
    setSort("newest");
  };

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
          Every public lesson the community has shared — search, filter, or just browse.
        </p>

        {/* Filter bar */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <SearchIcon />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title or keyword…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-[14px] text-[#ECEAE3] placeholder:text-[#5C6070] outline-none transition-colors focus:border-[#F2C14E]/50"
            />
          </div>

          <FilterSelect value={category} onChange={setCategory} options={["All", ...CATEGORIES]} />
          <FilterSelect value={tone} onChange={setTone} options={["All", ...TONES]} />
          <FilterSelect
            value={sort}
            onChange={setSort}
            options={["newest", "mostSaved"]}
            labels={{ newest: "Newest", mostSaved: "Most saved" }}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="whitespace-nowrap text-[13px] font-medium text-[#F2C14E] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="mt-4 text-[13px] text-[#6E7280]">
            {total} {total === 1 ? "lesson" : "lessons"} found
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">
            {error}
          </p>
        )}

        {/* Grid */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)
            : lessons.map((lesson) => (
                <LessonCard key={lesson._id} lesson={lesson} viewerIsPremium={viewerIsPremium} />
              ))}
        </div>

        {!loading && !error && lessons.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-16 text-center">
            <p className="text-[15px] text-[#9BA0AF]">
              {hasActiveFilters ? "No lessons match those filters." : "No public lessons yet."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[13.5px] font-medium text-[#F2C14E] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------- */

function FilterSelect({ value, onChange, options, labels = {} }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-3.5 pr-9 text-[14px] text-[#ECEAE3] outline-none transition-colors focus:border-[#F2C14E]/50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1B1E29] text-[#ECEAE3]">
            {labels[opt] || opt}
          </option>
        ))}
      </select>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7280]">
        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = useMemo(() => {
    // Show up to 5 page numbers centered on the current page.
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="mt-10 flex items-center justify-center gap-1.5">
      <PageButton disabled={page === 1} onClick={() => onChange(page - 1)} label="Previous">
        <ChevronIcon flip />
      </PageButton>

      {pages[0] > 1 && (
        <>
          <PageButton onClick={() => onChange(1)}>1</PageButton>
          {pages[0] > 2 && <span className="px-1 text-[#6E7280]">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageButton key={p} active={p === page} onClick={() => onChange(p)}>
          {p}
        </PageButton>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-[#6E7280]">…</span>}
          <PageButton onClick={() => onChange(totalPages)}>{totalPages}</PageButton>
        </>
      )}

      <PageButton disabled={page === totalPages} onClick={() => onChange(page + 1)} label="Next">
        <ChevronIcon />
      </PageButton>
    </div>
  );
}

function PageButton({ children, active, disabled, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-[#F2C14E] text-[#12141C]"
          : disabled
          ? "cursor-not-allowed text-[#4A4E5C]"
          : "text-[#9BA0AF] hover:bg-white/[0.06] hover:text-[#ECEAE3]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CardSkeleton() {
  return <div className="h-[300px] animate-pulse rounded-2xl bg-white/[0.04]" />;
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6E7280]">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ChevronIcon({ flip }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={flip ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}