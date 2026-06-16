import { Suspense } from "react";
import { PasswordResetSessionHandler } from "@/components/PasswordResetSessionHandler";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Suspense fallback={null}>
        <PasswordResetSessionHandler redirectIfNoResetLink="/dashboard" />
      </Suspense>
      <p className="text-sm text-slate-600">Loading...</p>
    </main>
  );
}
