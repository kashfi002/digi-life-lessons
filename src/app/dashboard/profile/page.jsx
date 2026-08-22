"use client";

import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();
  const [editOpen, setEditOpen] = useState(false);
  const { toasts, pushToast } = useToasts();

  if (isPending) return <PageSkeleton />;

  const user = session?.user;

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} />

      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[#F2C14E]">ACCOUNT</span>
        <h1
          className="mt-2 text-[26px] leading-tight text-[#ECEAE3] sm:text-[30px]"
          style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
        >
          Your profile.
        </h1>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1B1E29] p-8 sm:flex-row sm:items-center sm:gap-6">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#F2C14E]/15 text-[26px] font-semibold text-[#F2C14E] ring-1 ring-white/10">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[19px] font-medium text-[#ECEAE3]">{user?.name}</p>
          <p className="mt-0.5 text-[14px] text-[#9BA0AF]">{user?.email}</p>
          {user?.isPremium && (
            <span className="mt-2 inline-block rounded-full bg-[#F2C14E]/15 px-2.5 py-1 text-[11px] font-medium text-[#F2C14E]">
              PREMIUM ⭐
            </span>
          )}
        </div>

        <button
          onClick={() => setEditOpen(true)}
          className="shrink-0 rounded-full border border-white/10 px-5 py-2.5 text-[13.5px] font-medium text-[#ECEAE3] transition-colors hover:bg-white/[0.06]"
        >
          Edit profile
        </button>
      </div>

      {editOpen && (
        <EditProfileModal
          user={user}
          onCancel={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            refetch();
            pushToast("success", "Profile updated.");
          }}
          onError={() => pushToast("error", "Couldn't update your profile. Try again.")}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function EditProfileModal({ user, onCancel, onSaved, onError }) {
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || undefined,
      });
      if (error) throw new Error(error.message);
      onSaved();
    } catch {
      onError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1B1E29] p-6">
        <h3 className="text-[16px] font-semibold text-[#ECEAE3]">Edit profile</h3>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#ECEAE3]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14.5px] text-[#ECEAE3] outline-none transition-colors focus:border-[#F2C14E]/50"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#ECEAE3]">
              Photo URL <span className="text-[#6E7280]">(optional)</span>
            </span>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14.5px] text-[#ECEAE3] placeholder:text-[#5C6070] outline-none transition-colors focus:border-[#F2C14E]/50"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-full px-4 py-2 text-[13.5px] font-medium text-[#9BA0AF] hover:text-[#ECEAE3]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-full bg-[#F2C14E] px-5 py-2 text-[13.5px] font-semibold text-[#12141C] transition-colors hover:bg-[#F6CD6C] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
      <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

/* ---- self-contained toast system, same pattern as other dashboard pages ---- */

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