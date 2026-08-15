import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";

export default async function AdminLayout({ children }) {
  const session = await getServerSession();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}