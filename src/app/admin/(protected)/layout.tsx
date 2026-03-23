import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUser(["admin", "editor"]);
  return children;
}
