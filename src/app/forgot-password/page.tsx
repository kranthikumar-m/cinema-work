import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { requireLoggedOutUser } from "@/lib/auth";

interface ForgotPasswordPageProps {
  searchParams?: {
    next?: string | string[];
  };
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  await requireLoggedOutUser();

  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next[0]
    : searchParams?.next;

  const nextPath =
    nextParam?.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : undefined;

  return (
    <AuthPageShell
      eyebrow="Password recovery"
      title="Forgot password"
      description="Request a secure reset link. The flow is token-based, time-limited, and ready for email-provider integration in production."
    >
      <ForgotPasswordForm nextPath={nextPath} />
    </AuthPageShell>
  );
}
