import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const fallbackNext = type === "recovery" ? "/reset-password" : "/dashboard";
  const requestedNext = requestUrl.searchParams.get("next") || fallbackNext;
  const next = requestedNext.startsWith("/") ? requestedNext : "/dashboard";
  const redirectTo = new URL(next, requestUrl.origin);
  const errorRedirectTo = new URL("/reset-password?error=invalid_link", requestUrl.origin);
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error && next === "/reset-password") {
      return NextResponse.redirect(new URL("/reset-password?error=invalid_link", requestUrl.origin));
    }

    return NextResponse.redirect(error ? errorRedirectTo : redirectTo);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error && next === "/reset-password") {
      return NextResponse.redirect(new URL("/reset-password?error=invalid_link", requestUrl.origin));
    }

    return NextResponse.redirect(error ? errorRedirectTo : redirectTo);
  }

  return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
}
