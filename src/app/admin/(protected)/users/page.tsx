import { redirect } from "next/navigation";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { listUsers, requireAdminUser, userCanManageUsers } from "@/lib/auth";

export default async function AdminUsersPage() {
  const user = await requireAdminUser("/admin/users");

  if (!userCanManageUsers(user.storedRole)) {
    redirect("/unauthorized");
  }

  const users = await listUsers();

  return <AdminUserManagement initialUsers={users} currentUserId={user.id} />;
}
