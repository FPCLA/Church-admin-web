import { Suspense } from "react";
import { LoginPageContent } from "@/components/LoginPageContent";
import { PasswordResetSessionHandler } from "@/components/PasswordResetSessionHandler";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Suspense fallback={null}>
        <PasswordResetSessionHandler />
      </Suspense>
      <LoginPageContent initialError={params.error} initialStatus={params.status} />
    </main>
  );
}
