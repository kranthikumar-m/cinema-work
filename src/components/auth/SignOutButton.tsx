"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

interface SignOutButtonProps
  extends Omit<ButtonProps, "children" | "onClick"> {
  label?: string;
  pendingLabel?: string;
  redirectTo?: string;
  onSignedOut?: () => void;
}

export function SignOutButton({
  label = "Sign Out",
  pendingLabel = "Signing Out...",
  redirectTo = "/login",
  onSignedOut,
  variant = "outline",
  disabled,
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const auth = useOptionalAuthUser();
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut() {
    setSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      auth?.setUser(null);
      onSignedOut?.();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleSignOut}
      disabled={submitting || disabled}
      {...props}
    >
      {submitting ? pendingLabel : label}
    </Button>
  );
}
