import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { requireLoggedOutUser } from "@/lib/auth";

interface LoginPageProps {
  searchParams?: {
    next?: string | string[];
    registered?: string | string[];
    reset?: string | string[];
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await requireLoggedOutUser();

  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next[0]
    : searchParams?.next;
  const registeredParam = Array.isArray(searchParams?.registered)
    ? searchParams?.registered[0]
    : searchParams?.registered;
  const resetParam = Array.isArray(searchParams?.reset)
    ? searchParams?.reset[0]
    : searchParams?.reset;

  const nextPath =
    nextParam?.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : undefined;

  return (
    <AuthPageShell
      eyebrow="Account access"
      title="Sign in"
      description="Use your Telugu Cinema Updates account to manage your profile, keep your session active, and access protected areas including the admin console when your role allows it."
    >
      <LoginForm
        nextPath={nextPath}
        showRegisteredNotice={registeredParam === "1"}
        showResetNotice={resetParam === "1"}
      />
    </AuthPageShell>
  );
}
