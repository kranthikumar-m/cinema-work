"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ManageableUserRole, AdminUser } from "@/types/admin";

interface AdminUserManagementProps {
  initialUsers: AdminUser[];
  currentUserId: number;
}

type UserStatusFilter = "all" | "active" | "disabled";

const fieldClassName =
  "h-11 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

export function AdminUserManagement({
  initialUsers,
  currentUserId,
}: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<ManageableUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ManageableUserRole>("user");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  async function refreshUsers(nextFilters?: {
    query: string;
    role: ManageableUserRole | "all";
    status: UserStatusFilter;
  }) {
    const filters = nextFilters ?? {
      query,
      role: roleFilter,
      status: statusFilter,
    };

    const params = new URLSearchParams();

    if (filters.query.trim()) {
      params.set("query", filters.query.trim());
    }

    if (filters.role !== "all") {
      params.set("role", filters.role);
    }

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    setLoadingList(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        error?: string;
        users?: AdminUser[];
      };

      if (!response.ok || !payload.users) {
        throw new Error(payload.error || "Unable to load users.");
      }

      setUsers(payload.users);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load users."
      );
      return false;
    } finally {
      setLoadingList(false);
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          isActive,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: AdminUser;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Unable to create user.");
      }

      const refreshed = await refreshUsers();
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setIsActive(true);
      if (refreshed) {
        setSuccess("User created successfully.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create user."
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(
    userId: number,
    updates: {
      role?: ManageableUserRole;
      isActive?: boolean;
    }
  ) {
    setUpdatingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: AdminUser;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Unable to update user.");
      }

      const refreshed = await refreshUsers();

      if (refreshed) {
        setSuccess("User updated successfully.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update user."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function deleteUser(userId: number) {
    if (!window.confirm("Delete this user account? This cannot be undone.")) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete user.");
      }

      const refreshed = await refreshUsers();

      if (refreshed) {
        setSuccess("User deleted successfully.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete user."
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
            Create User
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
            Manually create new accounts, choose their role, and decide whether they should be
            active immediately.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="grid gap-4 lg:grid-cols-2">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Display name"
            className={fieldClassName}
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@telugucinema.com"
            className={fieldClassName}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            className={fieldClassName}
            required
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as ManageableUserRole)}
            className={fieldClassName}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <label className="inline-flex items-center gap-3 text-sm text-[var(--color-muted-strong)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            />
            Active on creation
          </label>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
              User Directory
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
              Search, filter, update roles, enable or disable access, and remove user accounts.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void refreshUsers();
            }}
            className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_160px_160px_auto]"
          >
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
              className={fieldClassName}
            />
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as ManageableUserRole | "all")
              }
              className={fieldClassName}
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as UserStatusFilter)
              }
              className={fieldClassName}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <Button type="submit" variant="outline" disabled={loadingList}>
              {loadingList ? "Loading..." : "Apply"}
            </Button>
          </form>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-2xl border border-[rgba(88,144,104,0.28)] bg-[rgba(35,72,46,0.26)] px-4 py-3 text-sm text-[#d5f3dc]">
            {success}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[rgba(255,255,255,0.02)]">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-sm text-[var(--color-text)]">
              {users.length ? (
                users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isBusy =
                    updatingUserId === user.id || deletingUserId === user.id;

                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">
                          {user.name?.trim() || "Unnamed user"}{" "}
                          {isSelf ? (
                            <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-accent)]">
                              You
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-[var(--color-muted-strong)]">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(event) =>
                            void updateUser(user.id, {
                              role: event.target.value as ManageableUserRole,
                            })
                          }
                          disabled={isBusy}
                          className={`${fieldClassName} w-[120px] px-3`}
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.isActive ? "active" : "disabled"}
                          onChange={(event) =>
                            void updateUser(user.id, {
                              isActive: event.target.value === "active",
                            })
                          }
                          disabled={isBusy}
                          className={`${fieldClassName} w-[130px] px-3`}
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-[var(--color-muted-strong)]">
                        {new Date(user.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-4 text-[var(--color-muted-strong)]">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString("en-GB")
                          : "Never"}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void deleteUser(user.id)}
                          disabled={isBusy || isSelf}
                          className="px-0 text-[#ffcfcc] hover:bg-transparent hover:text-[#ffe2de]"
                        >
                          {deletingUserId === user.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-[var(--color-muted-strong)]"
                  >
                    No users matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
