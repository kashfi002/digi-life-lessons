import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";

/**
 * Guards /pricing server-side: logged-out visitors bounce to /login
 * before any content renders — including on hard reload, which is what
 * the PDF's "logged-in users must not be redirected to Login on
 * reloading any private route" rule is actually protecting against.
 * Same pattern as /dashboard/layout.jsx.
 */
export default async function PricingLayout({ children }) {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}