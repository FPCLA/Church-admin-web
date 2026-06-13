import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const requestedNext = requestUrl.searchParams.get("next") || "/dashboard";
  const next = requestedNext.startsWith("/") ? requestedNext : "/dashboard";
  const redirectTo = new URL(next, requestUrl.origin);
  const errorRedirectTo = new URL("/login?error=invite_invalid", requestUrl.origin);
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(error ? errorRedirectTo : redirectTo);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    return NextResponse.redirect(error ? errorRedirectTo : redirectTo);
  }

  return NextResponse.redirect(errorRedirectTo);
}
