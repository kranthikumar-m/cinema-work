"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminRole, AdminUser } from "@/types/admin";

interface AdminUserManagementProps {
  initialUsers: AdminUser[];
}

export function AdminUserManagement({
  initialUsers,
}: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const payload = (await response.json()) as {
        error?: string;
        users?: AdminUser[];
      };

      if (!response.ok || !payload.users) {
        throw new Error(payload.error || "Unable to create user.");
      }

      setUsers(payload.users);
      setEmail("");
      setPassword("");
      setRole("editor");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create user."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(userId: number, nextRole: AdminRole) {
    setUpdatingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const payload = (await response.json()) as {
        error?: string;
        users?: AdminUser[];
      };

      if (!response.ok || !payload.users) {
        throw new Error(payload.error || "Unable to update role.");
      }

      setUsers(payload.users);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
          User Roles
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
          Admins can create accounts and adjust whether a user can edit backdrop overrides.
        </p>
      </div>

      <form onSubmit={createUser} className="grid gap-4 md:grid-cols-[1.5fr_1fr_180px_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="editor@telugucinema.com"
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          required
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AdminRole)}
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
        >
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Create User"}
        </Button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[rgba(255,255,255,0.02)]">
            <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] text-sm text-[var(--color-text)]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      updateRole(user.id, event.target.value as AdminRole)
                    }
                    disabled={updatingUserId === user.id}
                    className="h-10 rounded-lg border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-3 text-sm text-[var(--color-text)] outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted-strong)]">
                  {new Date(user.createdAt).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
