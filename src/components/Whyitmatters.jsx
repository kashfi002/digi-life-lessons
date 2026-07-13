"use client";
import { motion } from "framer-motion";

const BENEFITS = [
  {
    title: "Memory fades. Lessons don't.",
    body: "The exact thing that got you through won't stay sharp in your head forever. Written down, it doesn't blur with time — it's there, word for word, whenever you need it again.",
    icon: HourglassIcon,
  },
  {
    title: "Borrow ten years in ten minutes.",
    body: "It took someone a decade to learn what they wrote in four sentences. Reading it doesn't cost you the decade — that's the whole trade this platform is built on.",
    icon: FastForwardIcon,
  },
  {
    title: "Pain gets a second job.",
    body: "A hard chapter stays just a hard chapter unless it's put to use. Writing it as a lesson doesn't undo it — it gives it somewhere useful to go.",
    icon: EmberIcon,
  },
  {
    title: "A paper trail of who you've become.",
    body: "Every lesson you post is timestamped proof of what you knew and when. Read your own archive back in five years — you'll barely recognize who wrote the first one.",
    icon: StackIcon,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WhyItMatters() {
  return (
    <section className="bg-[#12141C] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">
          WHY IT MATTERS
        </span>
        <h2
          className="mt-4 max-w-xl text-[30px] leading-[1.2] text-[#ECEAE3] sm:text-[36px] md:text-[40px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Why learning from life{" "}
          <span className="relative inline-block whitespace-nowrap">
            actually matters
            <span
              aria-hidden="true"
              className="absolute inset-x-[-3%] bottom-[8%] -z-10 h-[36%] rounded-sm bg-[#F2C14E]/25"
              style={{ transform: "rotate(-1deg)" }}
            />
          </span>
        </h2>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#9BA0AF]">
          Wisdom is easy to lose and easy to waste. Here's what changes once you
          start writing it down — and reading what other people wrote.
        </p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {BENEFITS.map(({ title, body, icon: Icon }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F2C14E]/25 bg-[#F2C14E]/10">
                <Icon />
              </div>
              <h3
                className="mt-5 text-[19px] leading-snug text-[#ECEAE3]"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
              >
                {title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#9BA0AF]">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---- Icons — simple custom line-art, gold stroke, no icon library ---- */

function HourglassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 2.5h10M5 17.5h10M6 2.5c0 4 2 4.5 4 5.5 2-1 4-1.5 4-5.5M6 17.5c0-4 2-4.5 4-5.5 2 1 4 1.5 4 5.5"
        stroke="#F2C14E"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FastForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 4.5v11L11 10l-8.5-5.5Z" fill="#F2C14E" />
      <path d="M10.5 4.5v11L19 10l-8.5-5.5Z" fill="#F2C14E" fillOpacity="0.5" />
    </svg>
  );
}

function EmberIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2c1 2.2-1.4 3-1.4 5.2 0 1 .6 1.8 1.4 1.8s1.4-.8 1.4-1.8c1.8 1.6 2.6 3.6 2.6 5.3A4 4 0 1 1 6 12.5c0-2 1.2-3 1.6-4.3.3 1 1.1 1.5 1.7 1 .9-.7.2-1.9-.2-2.7C8.4 4.8 9 3 10 2Z"
        stroke="#F2C14E"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="3" width="10" height="6.5" rx="1.2" stroke="#F2C14E" strokeWidth="1.3" />
      <rect x="6" y="10.5" width="10" height="6.5" rx="1.2" stroke="#F2C14E" strokeWidth="1.3" strokeOpacity="0.55" />
    </svg>
  );
}