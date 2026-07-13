"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";

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
      style={{ transform: `${active ? "" : ""} rotate(0 deg)` }}
    />
  );
}

function LogoMark() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="34" height="34" rx="9" fill="#1B1E29" />
      <rect width="34" height="34" rx="9" stroke="#2A2E3B" strokeWidth="1" />
      {/* folded corner — a "page" */}
      <path d="M22 6H8a2 2 0 0 0-2 2v18l6-4 5 3 5-3 5 3V8a2 2 0 0 0-2-2Z" fill="none" stroke="#9BA0AF" strokeWidth="1.4" strokeLinejoin="round" />
      {/* the highlighter stroke through the page, echoing the nav signature */}
      <rect x="7" y="15.2" width="16" height="3.4" rx="1.7" fill="#F2C14E" transform="rotate(-3 15 17)" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
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
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group relative inline-block rounded-lg px-4 py-2 text-[15px] font-medium transition-colors duration-200",
                    isActive
                      ? "text-[#ECEAE3]"
                      : "text-[#9BA0AF] hover:text-[#ECEAE3]",
                  ].join(" ")}
                >
                  {link.label}
                  <HighlightMark active={isActive} />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Login CTA (desktop) */}
        <div className="hidden md:block">
          <Button
            radius="full"
            className="bg-[#F2C14E] px-6 font-semibold text-[#12141C] hover:bg-[#F6CD6C] transition-colors"
          >
            Log in
          </Button>
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
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "relative flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium",
                      isActive
                        ? "bg-white/[0.04] text-[#ECEAE3]"
                        : "text-[#9BA0AF]",
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
            <li className="pt-2">
              <Button
                radius="full"
                className="w-full bg-[#F2C14E] font-semibold text-[#12141C]"
              >
                Log in
              </Button>
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
 * If you'd rather skip next/font, the component already falls back to
 * Georgia for the wordmark, so nothing breaks without it.
 */