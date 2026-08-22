"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import LessonCard from "@/components/LessonCard";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function FeaturedPosts() {
  const { data: session } = useSession();
  const viewerIsPremium = Boolean(session?.user?.isPremium);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/lessons?featured=true&sort=newest&limit=6`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setLessons(data.lessons || []);
      } catch {
        if (!cancelled) setLessons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API]);

  // Nothing featured yet → don't show a half-empty section on the homepage.
  if (!loading && lessons.length === 0) return null;

  return (
    <section className="bg-[#12141C] px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">FEATURED</span>
          <h2
            className="mt-3 text-[28px] leading-tight text-[#ECEAE3] sm:text-[34px]"
            style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
          >
            Lessons worth reading twice.
          </h2>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#9BA0AF]">
            Hand-picked by the team — the ones that stuck with us.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : lessons.map((lesson) => (
                <motion.div key={lesson._id} variants={item}>
                  <LessonCard lesson={lesson} viewerIsPremium={viewerIsPremium} />
                </motion.div>
              ))}
        </motion.div>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return <div className="h-[300px] animate-pulse rounded-2xl bg-white/[0.04]" />;
}