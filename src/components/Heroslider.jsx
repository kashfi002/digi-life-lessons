"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";

const SLIDES = [
  {
    eyebrow: "WHY IT EXISTS",
    heading: ["Your story could be", "someone's ", "turning point", "."],
    body: "One honest paragraph from a stranger has changed more minds than a thousand pieces of advice. This is where those paragraphs live.",
    primary: { label: "Share your lesson", href: "/share" },
    secondary: { label: "See how it works", href: "/about" },
    card: { quote: "Rest is not the opposite of progress.", author: "R." },
  },
  {
    eyebrow: "WHAT'S INSIDE",
    heading: ["Real lessons,", "from ", "real people", "."],
    body: "Career pivots, breakups, grief, small daily wins — written by the people who lived them, not by a brand's content calendar.",
    primary: { label: "Explore lessons", href: "/explore" },
    secondary: { label: "Browse by topic", href: "/explore" },
    card: { quote: "The apology you're owed isn't coming. Move anyway.", author: "M." },
  },
  {
    eyebrow: "HOW YOU READ",
    heading: ["Read today.", "Remember ", "for life", "."],
    body: "One lesson at a time, chosen so it's actually worth remembering — not an endless feed you scroll past and forget.",
    primary: { label: "Get today's lesson", href: "/explore" },
    secondary: { label: "Join free", href: "/signup" },
    card: { quote: "Small boring days build the life you wanted.", author: "A." },
  },
  {
    eyebrow: "GO DEEPER",
    heading: ["Some lessons", "take ", "more than a page", "."],
    body: "Upgrade for long-form stories, private journaling prompts, and the full archive — from people who went back and wrote the rest.",
    primary: { label: "See Upgrade", href: "/upgrade" },
    secondary: { label: "Compare plans", href: "/upgrade" },
    card: { quote: "You can love someone and still leave.", author: "K." },
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    timerRef.current = setTimeout(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [active, paused, reduceMotion]);

  const go = (i) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[active];

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full overflow-hidden bg-[#12141C]"
    >
      {/* faint radial glow, shifts subtly per slide so slides feel distinct without changing the palette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-all duration-700"
        style={{
          background: `radial-gradient(600px 400px at ${20 + active * 15}% 20%, rgba(242,193,78,0.10), transparent 70%)`,
        }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 md:grid-cols-2 md:gap-8 md:px-8 md:py-24">
        {/* Text column */}
        <div className="flex flex-col justify-center">
          <div key={active} className="dll-fade-up">
            <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">
              {slide.eyebrow}
            </span>

            <h1
              className="mt-4 text-[34px] leading-[1.15] text-[#ECEAE3] sm:text-[42px] md:text-[48px]"
              style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
            >
              {slide.heading[0]}{" "}
              <span className="relative inline-block whitespace-nowrap">
                {slide.heading[1]}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-3%] bottom-[6%] -z-10 h-[38%] rounded-sm bg-[#F2C14E]/25"
                  style={{ transform: "rotate(-1deg)" }}
                />
              </span>
              {slide.heading[2]}
              {slide.heading[3]}
            </h1>

            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#9BA0AF]">
              {slide.body}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                as="a"
                href={slide.primary.href}
                radius="full"
                className="bg-[#F2C14E] px-6 font-semibold text-[#12141C] hover:bg-[#F6CD6C] transition-colors"
              >
                {slide.primary.label}
              </Button>
              <Button
                as="a"
                href={slide.secondary.href}
                radius="full"
                variant="bordered"
                className="border-white/15 px-6 font-medium text-[#ECEAE3] hover:border-white/30"
              >
                {slide.secondary.label}
              </Button>
            </div>
          </div>

          {/* Progress ticks — same highlighter-mark family as the navbar underline */}
          <div className="mt-12 flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className="group relative h-[6px] w-9 overflow-hidden rounded-full bg-white/10"
              >
                <span
                  className={[
                    "absolute inset-y-0 left-0 rounded-full bg-[#F2C14E]",
                    i === active
                      ? paused || reduceMotion
                        ? "w-full"
                        : "dll-progress"
                      : "w-0 group-hover:w-1/3 transition-all duration-300",
                  ].join(" ")}
                  style={
                    i === active && !paused && !reduceMotion
                      ? { animationDuration: `${AUTOPLAY_MS}ms` }
                      : undefined
                  }
                />
              </button>
            ))}
            <div className="ml-3 hidden items-center gap-1 sm:flex">
              <button
                onClick={() => go(active - 1)}
                aria-label="Previous slide"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#9BA0AF] transition-colors hover:border-white/25 hover:text-[#ECEAE3]"
              >
                ‹
              </button>
              <button
                onClick={() => go(active + 1)}
                aria-label="Next slide"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#9BA0AF] transition-colors hover:border-white/25 hover:text-[#ECEAE3]"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Card-deck column — desk of scattered paper lessons */}
        <div className="relative hidden min-h-[320px] items-center justify-center md:flex">
          <div className="relative h-[260px] w-[320px]">
            <div className="absolute inset-0 rotate-[7deg] translate-x-3 rounded-2xl bg-[#F5F1E8]/15" />
            <div className="absolute inset-0 -rotate-[5deg] -translate-x-2 translate-y-2 rounded-2xl bg-[#F5F1E8]/25" />
            <div
              key={active}
              className="dll-fade-up absolute inset-0 flex -rotate-[2deg] flex-col justify-between rounded-2xl bg-[#F5F1E8] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <span
                className="text-[34px] leading-none text-[#F2C14E]"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
              >
                “
              </span>
              <p
                className="text-[19px] leading-snug text-[#1B1E29]"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
              >
                {slide.card.quote}
              </p>
              <span className="font-mono text-[11px] tracking-[0.2em] text-[#7A7568]">
                — {slide.card.author}, DIGITAL LIFE LESSONS
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dll-fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dll-fade-up {
          animation: dll-fade-up 420ms ease-out both;
        }
        @keyframes dll-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .dll-progress {
          animation: dll-progress linear forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .dll-fade-up,
          .dll-progress {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
