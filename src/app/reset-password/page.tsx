import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { requireLoggedOutUser, verifyPasswordResetToken } from "@/lib/auth";

interface ResetPasswordPageProps {
  searchParams?: {
    token?: string | string[];
  };
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await requireLoggedOutUser();

  const tokenParam = Array.isArray(searchParams?.token)
    ? searchParams?.token[0]
    : searchParams?.token;
  const token = tokenParam ?? "";
  const tokenValid = token ? Boolean(await verifyPasswordResetToken(token)) : false;

  return (
    <AuthPageShell
      eyebrow="Password recovery"
      title="Reset password"
      description="Choose a new password for your account. Reset tokens expire automatically and are invalidated once used."
    >
      <ResetPasswordForm token={token} tokenValid={tokenValid} />
    </AuthPageShell>
  );
}
