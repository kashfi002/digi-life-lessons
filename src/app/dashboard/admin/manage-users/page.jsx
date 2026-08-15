"use client";

/**
 * Manage Users — /dashboard/admin/manage-users
 * -----------------------------------------------------------------------
 * Every user, with total lessons created and a role toggle. Promoting
 * someone to admin is a real, consequential action (they get the full
 * Admin sidebar next login) — so it goes through a confirm modal, same
 * as delete, rather than firing on a single click like the Featured/
 * Reviewed toggles on Manage Lessons.
 *
 * Self-demotion guard: an admin can't demote their OWN account from
 * this table (button is disabled with a tooltip) — otherwise it's easy
 * to accidentally lock yourself out of the admin panel with no other
 * admin account to fix it.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export default function ManageUsersPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [roleTarget, setRoleTarget] = useState(null); // { user, nextRole }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actioning, setActioning] = useState(false);
  const { toasts, pushToast } = useToasts();

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/users?adminId=${session.user.id}`);
      if (!res.ok) throw new Error("Couldn't load users.");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionPending) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPending, session?.user?.id]);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const updateLocal = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const handleRoleConfirm = async () => {
    if (!roleTarget) return;
    setActioning(true);
    const { user, nextRole } = roleTarget;
    try {
      const res = await fetch(`${API}/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, role: nextRole }),
      });
      if (!res.ok) throw new Error();
      updateLocal(user.id, { role: nextRole });
      pushToast("success", `${user.name || user.email} is now ${nextRole === "admin" ? "an admin" : "a regular user"}.`);
      setRoleTarget(null);
    } catch {
      pushToast("error", "Couldn't update role. Try again.");
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActioning(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      pushToast("success", "User deleted.");
      setDeleteTarget(null);
    } catch {
      pushToast("error", "Couldn't delete the user. Try again.");
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} />

      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">ADMIN</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Manage users.
        </h1>
      </div>

      <div className="relative max-w-xs">
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-[14px] text-[#ECEAE3] placeholder:text-[#5C6070] outline-none transition-colors focus:border-[#F2C14E]/50"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-[#E2685C]/10 px-4 py-3 text-[13.5px] text-[#E2685C]">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#1B1E29]">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#9BA0AF]">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Lessons</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-[#9BA0AF]">
                  {users.length === 0 ? "No users yet." : "No users match that search."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === session?.user?.id;
                return (
                  <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[12px] font-semibold text-[#F2C14E] ring-1 ring-white/10">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate font-medium text-[#ECEAE3]">
                          {u.name || "—"}
                          {isSelf && <span className="ml-1.5 text-[11px] text-[#6E7280]">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#9BA0AF]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
                          u.role === "admin"
                            ? "bg-[#F2C14E]/15 text-[#F2C14E]"
                            : "bg-white/[0.06] text-[#9BA0AF]",
                        ].join(" ")}
                      >
                        {u.role === "admin" ? "ADMIN" : "USER"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          u.isPremium ? "bg-[#F2C14E]/15 text-[#F2C14E]" : "bg-white/[0.06] text-[#9BA0AF]",
                        ].join(" ")}
                      >
                        {u.isPremium ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9BA0AF]">{u.totalLessons}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={isSelf}
                          title={isSelf ? "You can't change your own role here." : undefined}
                          onClick={() =>
                            setRoleTarget({ user: u, nextRole: u.role === "admin" ? "user" : "admin" })
                          }
                          className="rounded-full border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          {u.role === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button
                          disabled={isSelf}
                          title={isSelf ? "You can't delete your own account here." : undefined}
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-full border border-[#E2685C]/25 px-3 py-1.5 text-[12.5px] font-medium text-[#E2685C] transition-colors hover:bg-[#E2685C]/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {roleTarget && (
        <ConfirmModal
          title={roleTarget.nextRole === "admin" ? "Promote to admin?" : "Remove admin access?"}
          body={
            <>
              <span className="font-medium text-[#ECEAE3]">
                {roleTarget.user.name || roleTarget.user.email}
              </span>{" "}
              will {roleTarget.nextRole === "admin"
                ? "get full access to the admin dashboard, including managing users and lessons."
                : "lose access to the admin dashboard and go back to a regular account."}
            </>
          }
          confirmLabel={roleTarget.nextRole === "admin" ? "Promote" : "Demote"}
          confirmingLabel="Saving…"
          danger={roleTarget.nextRole !== "admin"}
          actioning={actioning}
          onCancel={() => setRoleTarget(null)}
          onConfirm={handleRoleConfirm}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete this user?"
          body={
            <>
              <span className="font-medium text-[#ECEAE3]">
                {deleteTarget.name || deleteTarget.email}
              </span>{" "}
              will be permanently removed. Their existing lessons, favorites, and comments are NOT
              deleted along with them.
            </>
          }
          confirmLabel="Delete permanently"
          confirmingLabel="Deleting…"
          danger
          actioning={actioning}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function ConfirmModal({ title, body, confirmLabel, confirmingLabel, danger, actioning, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">{title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#9BA0AF]">{body}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actioning}
            className={[
              "rounded-full px-5 py-2 text-[13.5px] font-semibold text-white transition-colors disabled:opacity-50",
              danger ? "bg-[#E2685C] hover:bg-[#EA7C71]" : "bg-[#F2C14E] text-[#12141C] hover:bg-[#F6CD6C]",
            ].join(" ")}
          >
            {actioning ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6E7280]">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ---- self-contained toast system, same pattern as the other dashboard pages ---- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  return { toasts, pushToast };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "rounded-xl border px-4 py-3 text-[13.5px] font-medium shadow-lg backdrop-blur-sm",
            t.type === "success"
              ? "border-[#F2C14E]/25 bg-[#1B1E29]/95 text-[#F2C14E]"
              : "border-[#E2685C]/25 bg-[#1B1E29]/95 text-[#E2685C]",
          ].join(" ")}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}