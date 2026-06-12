import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_AUTH_URL,
  brokerOrigin,
  isAllowedReturnUrl,
  requiredEnv,
  signState,
} from "@/lib/auth-broker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of the mobile Google sign-in (docs/auth.md): the app opens this URL in
 * the system browser with `?return=<app deep link>`; we hand off to Google's
 * OAuth consent screen with *this server* as the redirect target.
 */
export function GET(req: NextRequest) {
  const returnUrl = req.nextUrl.searchParams.get("return");
  if (!returnUrl || !isAllowedReturnUrl(returnUrl)) {
    return new NextResponse(
      "Invalid or missing `return` URL (must be an exp:// or onelane:// deep link).",
      { status: 400 },
    );
  }
  const params = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_OAUTH_CLIENT_ID"),
    redirect_uri: `${brokerOrigin(req)}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: signState(returnUrl),
    prompt: "select_account",
  });
  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);
}
