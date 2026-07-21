"use client";

/**
 * Navbar — Digital Life Lessons
 * -----------------------------------------------------------------------
 * Matches the PDF's actual navbar spec:
 *   Home · Add Lesson (protected) · My Lessons (protected) ·
 *   Public Lessons · Pricing/Upgrade (protected, free-plan-only) ·
 *   Login/Signup (logged out) · Avatar dropdown (logged in): Name,
 *   Profile, Dashboard, Logout
 *
 * "Protected" here is UI-only — these links are hidden when logged out
 * purely for tidiness. The actual gate is the server-side check in
 * /dashboard/layout.jsx, which redirects anyone without a session
 * regardless of how they reached the URL (typed directly, bookmarked,
 * expired session mid-browse, etc). Hiding a nav link is not security.
 *
 * The avatar menu is a plain custom dropdown (click-toggle + outside
 * click / Escape to close) — not HeroUI's Dropdown/Button, since that
 * combo swallowed clicks earlier. This is three real destinations
 * (Profile, Dashboard, Logout), too many to lay out inline like the
 * simpler avatar+logout row we used on the marketing homepage.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

function HighlightMark({ active }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "pointer-events-none absolute left-[-6%] right-[-6%] -bottom-1.5 h-[7px] rounded-full",
        "origin-left transition-transform duration-300 ease-out",
        active
          ? "scale-x-100 bg-[#F2C14E]"
          : "scale-x-0 bg-[#F2C14E]/40 group-hover:scale-x-100",
      ].join(" ")}
      style={{ transform: "rotate(-1.2deg)" }}
    />
  );
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="shrink-0">
      <rect width="34" height="34" rx="9" fill="#1B1E29" />
      <rect width="34" height="34" rx="9" stroke="#2A2E3B" strokeWidth="1" />
      <path
        d="M22 6H8a2 2 0 0 0-2 2v18l6-4 5 3 5-3 5 3V8a2 2 0 0 0-2-2Z"
        fill="none"
        stroke="#9BA0AF"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="7" y="15.2" width="16" height="3.4" rx="1.7" fill="#F2C14E" transform="rotate(-3 15 17)" />
    </svg>
  );
}

function firstLetterOf(name, email) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function Avatar({ user, size = 32 }) {
  const style = { width: size, height: size };
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name || "Account"}
        style={style}
        className="shrink-0 rounded-full object-cover ring-1 ring-white/10"
      />
    );
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[13px] font-semibold text-[#F2C14E] ring-1 ring-white/10"
    >
      {firstLetterOf(user?.name, user?.email)}
    </div>
  );
}

function buildNavLinks({ isLoggedIn, isPremium }) {
  const links = [
    { label: "Home", href: "/", show: true },
    { label: "Add Lesson", href: "/dashboard/add-lesson", show: isLoggedIn },
    { label: "My Lessons", href: "/dashboard/my-lessons", show: isLoggedIn },
    { label: "Public Lessons", href: "/public-lessons", show: true },
    { label: "Upgrade", href: "/pricing", show: isLoggedIn && !isPremium },
  ];
  return links.filter((l) => l.show);
}

function isLinkActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

// Custom avatar dropdown — plain state + outside-click close, no HeroUI.
function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-white/[0.05]"
      >
        <Avatar user={user} />
        <span className="hidden max-w-[100px] truncate text-[14px] font-medium text-[#ECEAE3] lg:inline">
          {user.name || user.email}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={["text-[#9BA0AF] transition-transform", open ? "rotate-180" : ""].join(" ")}
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1B1E29] shadow-2xl"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="truncate text-[13.5px] font-medium text-[#ECEAE3]">
              {user.name || "Your account"}
            </p>
            <p className="truncate text-[12.5px] text-[#9BA0AF]">{user.email}</p>
          </div>
          <div className="flex flex-col p-1.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-[14px] text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
            >
              Profile
            </Link>
            <Link
              href="/dashboard/user"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-[14px] text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="rounded-lg px-3 py-2 text-left text-[14px] text-[#F2C14E] transition-colors hover:bg-white/[0.06]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthArea({ session, isPending, onSignOut }) {
  if (isPending) {
    return <div className="h-9 w-[140px] animate-pulse rounded-full bg-white/[0.06]" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-[14.5px] font-medium text-[#9BA0AF] transition-colors hover:text-[#ECEAE3]"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-[#F2C14E] px-5 py-2 text-[14.5px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return <AccountMenu user={session.user} onSignOut={onSignOut} />;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = Boolean(session?.user);
  const isPremium = Boolean(session?.user?.isPremium);
  const navLinks = buildNavLinks({ isLoggedIn, isPremium });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled
          ? "bg-[#12141C]/80 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-[#12141C] border-b border-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 md:px-8">
        {/* Logo / wordmark */}
        <Link href="/" className="group flex items-center gap-3">
          <LogoMark />
          <span className="flex flex-col leading-none">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9BA0AF]">
              DIGITAL
            </span>
            <span
              className="text-[19px] font-semibold text-[#ECEAE3]"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              Life Lessons
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative inline-block rounded-lg px-4 py-2 text-[15px] font-medium transition-colors duration-200",
                    active ? "text-[#ECEAE3]" : "text-[#9BA0AF] hover:text-[#ECEAE3]",
                  ].join(" ")}
                >
                  {link.label}
                  <HighlightMark active={active} />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Auth area (desktop) */}
        <div className="hidden md:block">
          <AuthArea session={session} isPending={isPending} onSignOut={handleSignOut} />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#ECEAE3] md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={[
                "absolute left-0 top-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300",
                mobileOpen ? "top-[7px] rotate-45" : "",
              ].join(" ")}
            />
            <span
              className={[
                "absolute left-0 top-[7px] block h-[2px] w-5 rounded-full bg-current transition-opacity duration-200",
                mobileOpen ? "opacity-0" : "opacity-100",
              ].join(" ")}
            />
            <span
              className={[
                "absolute left-0 bottom-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300",
                mobileOpen ? "bottom-[7px] -rotate-45" : "",
              ].join(" ")}
            />
          </span>
        </button>
      </nav>

      {/* Mobile panel */}
      <div
        className={[
          "grid overflow-hidden transition-all duration-300 ease-out md:hidden",
          mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0">
          <ul className="flex flex-col gap-1 border-t border-white/[0.06] px-5 py-4">
            {navLinks.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium",
                      active ? "bg-white/[0.04] text-[#ECEAE3]" : "text-[#9BA0AF]",
                    ].join(" ")}
                  >
                    <span className="relative inline-block">
                      {link.label}
                      <HighlightMark active={active} />
                    </span>
                  </Link>
                </li>
              );
            })}

            <li className="pt-3">
              {isPending ? (
                <div className="h-10 w-full animate-pulse rounded-full bg-white/[0.06]" />
              ) : session?.user ? (
                <div className="flex flex-col gap-1 rounded-xl bg-white/[0.04] p-3">
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <Avatar user={session.user} size={30} />
                    <span className="max-w-[160px] truncate text-[14px] text-[#ECEAE3]">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <Link href="/dashboard/profile" className="rounded-lg px-2 py-2 text-[14px] text-[#9BA0AF]">
                    Profile
                  </Link>
                  <Link href="/dashboard/user" className="rounded-lg px-2 py-2 text-[14px] text-[#9BA0AF]">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg px-2 py-2 text-left text-[14px] font-medium text-[#F2C14E]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex-1 rounded-full border border-white/10 py-2.5 text-center text-[14px] font-medium text-[#ECEAE3]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 rounded-full bg-[#F2C14E] py-2.5 text-center text-[14px] font-semibold text-[#12141C]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

/**
 * Fonts — add once in app/layout.jsx:
 *
 *   import { Fraunces, Inter } from "next/font/google";
 *   const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["500","600"] });
 *   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
 *
 *   <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
 *
 * Route name assumption: "Public Lessons" points to /public-lessons —
 * the PDF doesn't give an explicit slug, so rename this one link if you
 * pick a different route name for that page.
 */