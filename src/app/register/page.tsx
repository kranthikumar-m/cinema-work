import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { requireLoggedOutUser } from "@/lib/auth";

interface RegisterPageProps {
  searchParams?: {
    next?: string | string[];
  };
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
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
      eyebrow="Create account"
      title="Register"
      description="Create a real user account with secure password storage, long-lived sessions, and access to protected Telugu movie features."
    >
      <RegisterForm nextPath={nextPath} />
    </AuthPageShell>
  );
}
