import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

/**
 * Wraps every /dashboard/* page. Two jobs:
 *   1. Server-side auth guard — redirect to /login if no session, so
 *      reloading a protected route never flashes/bounces incorrectly.
 *   2. Set the dark background HERE, at the wrapper level, not inside
 *      each individual page. This is exactly the piece that was
 *      missing — without it, anything not sitting inside one of the
 *      dark card divs (like the "Welcome back" greeting, which sits
 *      directly on the page background) falls back to the browser's
 *      default white, and light-colored heading text on white reads as
 *      washed out and barely legible.
 *
 * If your DashboardSidebar.jsx lives at a different path, adjust the
 * import above to match.
 */
export default async function DashboardLayout({ children }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#0E0F15]">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 bg-[#12141C] p-5 md:p-8">{children}</main>
    </div>
  );
}