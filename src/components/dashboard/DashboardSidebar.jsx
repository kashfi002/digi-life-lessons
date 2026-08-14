"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

const MAIN_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon, exact: true },
  { label: "Add Lesson", href: "/dashboard/add-lesson", icon: PlusIcon },
  { label: "My Lessons", href: "/dashboard/my-lessons", icon: StackIcon },
  { label: "My Favorites", href: "/dashboard/my-favorites", icon: BookmarkIcon },
  { label: "Profile", href: "/dashboard/profile", icon: UserIcon },
];

const ADMIN_LINKS = [
  { label: "Admin Home", href: "/dashboard/admin", icon: ShieldIcon, exact: true },
  { label: "Manage Users", href: "/dashboard/admin/manage-users", icon: UsersIcon },
  { label: "Manage Lessons", href: "/dashboard/admin/manage-lessons", icon: DocIcon },
  { label: "Reported Lessons", href: "/dashboard/admin/reported-lessons", icon: FlagIcon },
  { label: "Admin Profile", href: "/dashboard/admin/profile", icon: UserIcon },
];

function firstLetterOf(name, email) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function isLinkActive(pathname, href, exact) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavGroup({ title, links, pathname, onNavigate }) {
  return (
    <div>
      <span className="px-3 font-mono text-[10.5px] tracking-[0.2em] text-[#6E7280]">
        {title}
      </span>
      <ul className="mt-2.5 flex flex-col gap-0.5">
        {links.map(({ label, href, icon: Icon, exact }) => {
          const active = isLinkActive(pathname, href, exact);
          return (
            <li key={href} className="relative">
              <span
                aria-hidden="true"
                className={[
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#F2C14E] transition-transform duration-200 origin-center",
                  active ? "scale-y-100" : "scale-y-0",
                ].join(" ")}
              />
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                  active
                    ? "bg-white/[0.06] text-[#ECEAE3]"
                    : "text-[#9BA0AF] hover:bg-white/[0.03] hover:text-[#ECEAE3]",
                ].join(" ")}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({ pathname, session, onSignOut, onNavigate }) {
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const isPremium = user?.isPremium;

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 px-2 pb-6 pt-1">
        <svg width="28" height="28" viewBox="0 0 34 34" fill="none" className="shrink-0">
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
        <span
          className="text-[16px] font-semibold text-[#ECEAE3]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Life Lessons
        </span>
      </Link>

      {/* Mini profile card */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || "Account"}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[15px] font-semibold text-[#F2C14E] ring-1 ring-white/10">
            {firstLetterOf(user?.name, user?.email)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#ECEAE3]">
            {user?.name || user?.email || "…"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {isAdmin && (
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#9BA0AF]">
                ADMIN
              </span>
            )}
            {isPremium ? (
              <span className="rounded-full bg-[#F2C14E]/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#F2C14E]">
                PREMIUM ⭐
              </span>
            ) : (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#6E7280]">
                FREE PLAN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex flex-1 flex-col gap-7 overflow-y-auto pb-4">
        <NavGroup title="MAIN" links={MAIN_LINKS} pathname={pathname} onNavigate={onNavigate} />
        {isAdmin && (
          <NavGroup title="ADMIN" links={ADMIN_LINKS} pathname={pathname} onNavigate={onNavigate} />
        )}
      </nav>

      {/* Footer actions */}
      <div className="flex flex-col gap-1 border-t border-white/[0.06] pt-3">
        {!isPremium && (
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#F2C14E] transition-colors hover:bg-[#F2C14E]/[0.08]"
          >
            <CrownIcon />
            Upgrade to Premium
          </Link>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#9BA0AF] transition-colors hover:bg-white/[0.03] hover:text-[#ECEAE3]"
        >
          <ArrowLeftIcon />
          Back to site
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-[#9BA0AF] transition-colors hover:bg-white/[0.03] hover:text-[#ECEAE3]"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#12141C] px-4 py-3 md:hidden">
        <span
          className="text-[15px] font-semibold text-[#ECEAE3]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Dashboard
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open dashboard menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#ECEAE3]"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/[0.06] bg-[#12141C] px-4 py-5 md:block">
        <SidebarContent
          pathname={pathname}
          session={session}
          onSignOut={handleSignOut}
          onNavigate={() => {}}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 max-w-[85%] border-r border-white/[0.06] bg-[#12141C] px-4 py-5 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close dashboard menu"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-[#9BA0AF] hover:text-[#ECEAE3]"
            >
              <CloseIcon />
            </button>
            <SidebarContent
              pathname={pathname}
              session={session}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

/* ---- Icons — small custom line-art, currentColor-driven via active prop ---- */

function iconColor(active) {
  return active ? "#F2C14E" : "currentColor";
}

function HomeIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M3 9.5 10 3l7 6.5V17a1 1 0 0 1-1 1h-3.5v-5.5h-5V18H4a1 1 0 0 1-1-1V9.5Z" stroke={iconColor(active)} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={iconColor(active)} strokeWidth="1.4" />
      <path d="M10 6.5v7M6.5 10h7" stroke={iconColor(active)} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function StackIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="10" height="6" rx="1.2" stroke={iconColor(active)} strokeWidth="1.4" />
      <rect x="6" y="10.5" width="10" height="6" rx="1.2" stroke={iconColor(active)} strokeWidth="1.4" strokeOpacity="0.6" />
    </svg>
  );
}
function BookmarkIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3.5L4 17V4a1 1 0 0 1 1-1Z" stroke={iconColor(active)} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.8" r="3.3" stroke={iconColor(active)} strokeWidth="1.4" />
      <path d="M3.5 17c1-3.4 3.8-5 6.5-5s5.5 1.6 6.5 5" stroke={iconColor(active)} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5 16.5 5v5.2c0 4-2.8 6.6-6.5 7.8-3.7-1.2-6.5-3.8-6.5-7.8V5L10 2.5Z" stroke={iconColor(active)} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.3 10 9.3 12l3.4-4" stroke={iconColor(active)} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="7.2" cy="6.5" r="2.7" stroke={iconColor(active)} strokeWidth="1.4" />
      <circle cx="14" cy="7.5" r="2.1" stroke={iconColor(active)} strokeWidth="1.4" strokeOpacity="0.6" />
      <path d="M2.5 17c.8-2.9 2.7-4.3 4.7-4.3s3.9 1.4 4.7 4.3M12.8 13.2c1.7.2 3 1.4 3.6 3.8" stroke={iconColor(active)} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M5 2.5h7l3 3V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke={iconColor(active)} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 9h7M6.5 12.5h7M6.5 5.5h3" stroke={iconColor(active)} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function FlagIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M5 17V3" stroke={iconColor(active)} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 4h9l-2.2 3L14 10H5" stroke={iconColor(active)} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function CrownIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M3 15h14l-1.2-7.5-3.6 3-2.2-5-2.2 5-3.6-3L3 15Z" stroke="#F2C14E" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 4 6 10l6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M8 3H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.5 6.5 17 10l-4.5 3.5M17 10H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M4 4l12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

