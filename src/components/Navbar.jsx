"use client";

/**
 * Navbar — Digital Life Lessons
 * -----------------------------------------------------------------------
 * CHANGE: the signed-in state was a Dropdown before — avatar tucked
 * inside a menu you had to click to reveal "Log out". Simplified to a
 * plain inline row: avatar circle (photo, or first letter of the name
 * if there's no photo) sitting directly beside a "Log out" button.
 * No menu, nothing hidden.
 *
 * "Log in" is a plain <Link> (not a HeroUI Button) — HeroUI's Button
 * wrapper was swallowing the click before Next could navigate.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Upgrade", href: "/upgrade" },
  { label: "About", href: "/about" },
];

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

// First letter of the name — falls back to the email's first letter if no name is set.
function firstLetterOf(name, email) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function Avatar({ user, size = 34 }) {
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
      className="flex shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[14px] font-semibold text-[#F2C14E] ring-1 ring-white/10"
    >
      {firstLetterOf(user?.name, user?.email)}
    </div>
  );
}

// Plain <Link> styled as the gold pill — no HeroUI Button wrapper involved.
function LoginPill({ className = "" }) {
  return (
    <Link
      href="/login"
      className={[
        "inline-flex items-center justify-center rounded-full bg-[#F2C14E] px-6 py-2 text-[14.5px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C]",
        className,
      ].join(" ")}
    >
      Log in
    </Link>
  );
}

function AuthArea({ session, isPending, onSignOut }) {
  if (isPending) {
    return <div className="h-9 w-[92px] animate-pulse rounded-full bg-white/[0.06]" />;
  }

  if (!session?.user) {
    return <LoginPill />;
  }

  const { user } = session;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <Avatar user={user} />
        <span className="hidden max-w-[110px] truncate text-[14px] font-medium text-[#ECEAE3] lg:inline">
          {user.name || user.email}
        </span>
      </div>
      <button
        onClick={onSignOut}
        className="rounded-full border border-white/10 px-4 py-1.5 text-[13px] font-medium text-[#9BA0AF] transition-colors hover:border-[#F2C14E]/40 hover:text-[#F2C14E]"
      >
        Log out
      </button>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group relative inline-block rounded-lg px-4 py-2 text-[15px] font-medium transition-colors duration-200",
                    isActive ? "text-[#ECEAE3]" : "text-[#9BA0AF] hover:text-[#ECEAE3]",
                  ].join(" ")}
                >
                  {link.label}
                  <HighlightMark active={isActive} />
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
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "relative flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium",
                      isActive ? "bg-white/[0.04] text-[#ECEAE3]" : "text-[#9BA0AF]",
                    ].join(" ")}
                  >
                    <span className="relative inline-block">
                      {link.label}
                      <HighlightMark active={isActive} />
                    </span>
                  </Link>
                </li>
              );
            })}

            <li className="pt-3">
              {isPending ? (
                <div className="h-10 w-full animate-pulse rounded-full bg-white/[0.06]" />
              ) : session?.user ? (
                <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar user={session.user} size={30} />
                    <span className="max-w-[140px] truncate text-[14px] text-[#ECEAE3]">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[13px] font-medium text-[#F2C14E]"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <LoginPill className="w-full" />
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
 * Adjust the "@/lib/auth-client" import path if your jsconfig alias
 * differs — your screenshot shows src/lib/auth-client.js, which matches.
 */