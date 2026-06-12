import { LoginPageContent } from "@/components/LoginPageContent";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginPageContent initialError={params.error} />
    </main>
  );
}
