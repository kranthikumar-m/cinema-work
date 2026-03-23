"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";

export function AdminSignOutButton() {
  return (
    <SignOutButton
      redirectTo="/login?next=%2Fadmin"
      label="Sign Out"
      pendingLabel="Signing Out..."
      variant="outline"
    />
  );
}
