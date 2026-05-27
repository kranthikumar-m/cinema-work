"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";
import type { AuthUser } from "@/types/auth";

const fieldClassName =
  "h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

interface AccountProfileFormProps {
  initialUser: AuthUser;
}

export function AccountProfileForm({
  initialUser,
}: AccountProfileFormProps) {
  const auth = useOptionalAuthUser();
  const [name, setName] = useState(initialUser.name ?? "");
  const [image, setImage] = useState(initialUser.image ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim() || null,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: AuthUser;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Unable to update profile.");
      }

      auth?.setUser(payload.user);
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update profile."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="account-name" className="text-sm font-medium text-[var(--color-muted-strong)]">
            Display name
          </label>
          <input
            id="account-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClassName}
            placeholder="Your display name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="account-email" className="text-sm font-medium text-[var(--color-muted-strong)]">
            Email
          </label>
          <input
            id="account-email"
            type="email"
            value={initialUser.email}
            readOnly
            className={`${fieldClassName} cursor-not-allowed opacity-70`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account-image" className="text-sm font-medium text-[var(--color-muted-strong)]">
          Avatar image URL
        </label>
        <input
          id="account-image"
          type="url"
          value={image}
          onChange={(event) => setImage(event.target.value)}
          className={fieldClassName}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-[rgba(88,144,104,0.28)] bg-[rgba(35,72,46,0.26)] px-4 py-3 text-sm text-[#d5f3dc]">
          {success}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
