"use client";

import { type EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordResetSessionHandler({
  redirectIfNoResetLink,
}: {
  redirectIfNoResetLink?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHandlingResetLink, setIsHandlingResetLink] = useState(false);
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    async function handleResetLink() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");
      const hashError = hashParams.get("error");

      const hasResetCredential =
        Boolean(code) ||
        Boolean(tokenHash && type) ||
        Boolean(accessToken && refreshToken && hashType === "recovery");

      if (!hasResetCredential && !hashError) {
        if (redirectIfNoResetLink) {
          router.replace(redirectIfNoResetLink);
        }
        return;
      }

      setIsHandlingResetLink(true);
      const supabase = createSupabaseBrowserClient();

      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && type
          ? await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as EmailOtpType,
            })
          : accessToken && refreshToken
            ? await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })
            : { error: new Error(hashError || "Invalid password reset link.") };

      if (error) {
        setLinkError(true);
        setIsHandlingResetLink(false);
        router.replace("/reset-password?error=invalid_link");
        return;
      }

      router.replace("/reset-password");
      router.refresh();
    }

    void handleResetLink();
  }, [redirectIfNoResetLink, router, searchParams]);

  if (!isHandlingResetLink) {
    return linkError ? (
      <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Reset link could not be verified. Please request a new email from this browser.
      </p>
    ) : null;
  }

  return (
    <p className="mb-5 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
      Verifying password reset link, please wait...
    </p>
  );
}
