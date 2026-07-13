"use client";

/**
 * Footer — Digital Life Lessons
 * -----------------------------------------------------------------------
 * Deliberately the quietest component in the set. The highlighter-mark
 * signature has already had its moment in the nav, hero, and benefit
 * cards — repeating it here would dilute it, so the footer just holds
 * the brand steady: logo, contact, legal, socials, done.
 *
 * Tokens shared with Navbar.jsx / HeroSlider.jsx / WhyItMatters.jsx:
 *   ink #12141C · ink-3 #0E0F15 (footer bg, one shade darker — grounds
 *   the page like the bottom of a desk) · gold #F2C14E · Fraunces / Inter
 *   / JetBrains Mono
 */

import Link from "next/link";

const SOCIALS = [
  { label: "X", href: "https://x.com/digitallifelessons", icon: XIcon },
  { label: "Instagram", href: "https://instagram.com/digitallifelessons", icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com/@digitallifelessons", icon: TikTokIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/digitallifelessons", icon: LinkedInIcon },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0E0F15] px-5 py-14 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        {/* Logo + name */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-3">
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
          <p className="max-w-[240px] text-[13.5px] leading-relaxed text-[#9BA0AF]">
            A place to write down what life taught you — and read what it
            taught everyone else.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-[#9BA0AF]">
            CONTACT
          </span>
          <a
            href="mailto:hello@digitallifelessons.com"
            className="text-[14.5px] text-[#ECEAE3] transition-colors hover:text-[#F2C14E]"
          >
            hello@digitallifelessons.com
          </a>
          <a
            href="tel:+18005550142"
            className="text-[14.5px] text-[#ECEAE3] transition-colors hover:text-[#F2C14E]"
          >
            +1 (800) 555-0142
          </a>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-[#9BA0AF]">
            LEGAL
          </span>
          <Link
            href="/terms"
            className="text-[14.5px] text-[#ECEAE3] transition-colors hover:text-[#F2C14E]"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="/privacy"
            className="text-[14.5px] text-[#ECEAE3] transition-colors hover:text-[#F2C14E]"
          >
            Privacy Policy
          </Link>
        </div>

        {/* Socials */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-[#9BA0AF]">
            FOLLOW
          </span>
          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#9BA0AF] transition-colors hover:border-[#F2C14E]/40 hover:text-[#F2C14E]"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col-reverse items-center gap-4 border-t border-white/[0.05] pt-6 text-[12.5px] text-[#6E7280] sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Digital Life Lessons. All rights reserved.</span>
        <span className="font-mono tracking-[0.15em] text-[#6E7280]">
          WRITTEN BY REAL PEOPLE
        </span>
      </div>
    </footer>
  );
}

/* ---- Logo (matches Navbar.jsx) ---- */

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 34 34" fill="none">
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

/* ---- Social icons — custom, minimal, currentColor so hover states just work ---- */

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l7.5 9.6L3.4 21H6l6-6.6 4.8 6.6H21l-8-10.2L20.2 3h-2.6l-5.5 6-4.4-6H3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 3v10.8a3.4 3.4 0 1 1-2.6-3.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 3c.3 2.3 1.9 4 4.3 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="8.2" r="1.2" fill="currentColor" />
      <path
        d="M8 11v6M12 11v6M12 13.4c0-1.6 1-2.4 2.3-2.4S16.5 12 16.5 13.6V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Usage — app/page.jsx:
 *
 *   import Navbar from "@/components/Navbar";
 *   import HeroSlider from "@/components/HeroSlider";
 *   import WhyItMatters from "@/components/WhyItMatters";
 *   import Footer from "@/components/Footer";
 *
 *   export default function Home() {
 *     return (
 *       <>
 *         <Navbar />
 *         <HeroSlider />
 *         <WhyItMatters />
 *         <Footer />
 *       </>
 *     );
 *   }
 *
 * Swap the mailto/tel/social hrefs and terms/privacy routes for your
 * real ones — these are placeholders.
 */