import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_TOKEN_URL,
  adminAuth,
  brokerOrigin,
  requiredEnv,
  upsertFirebaseUser,
  verifyState,
} from "@/lib/auth-broker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 2 of the mobile Google sign-in (docs/auth.md): Google redirects here with
 * an auth code; we exchange it, verify the identity, mint a Firebase custom
 * token (Admin SDK), and deep-link it back into the app, which finishes with
 * `signInWithCustomToken`. Errors are deep-linked back too (`?error=`) so the
 * app can show them — except an invalid `state`, where the return URL itself
 * can't be trusted.
 */
export async function GET(req: NextRequest) {
  let returnUrl: string | null;
  try {
    returnUrl = verifyState(req.nextUrl.searchParams.get("state") ?? "");
  } catch (e) {
    // verifyState needs the state secret env — surface misconfiguration
    // instead of Next.js prod's blank 500.
    return new NextResponse(
      `Auth broker misconfigured: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 },
    );
  }
  if (!returnUrl) {
    return new NextResponse("Invalid or expired sign-in state. Please try again.", {
      status: 400,
    });
  }
  const backToApp = (params: Record<string, string>) =>
    NextResponse.redirect(
      `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}${new URLSearchParams(params)}`,
    );

  const oauthError = req.nextUrl.searchParams.get("error");
  if (oauthError) return backToApp({ error: `Google sign-in failed: ${oauthError}` });
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return backToApp({ error: "Google sign-in failed: missing auth code." });

  try {
    // Exchange the code server-side. The id_token comes straight from Google
    // over TLS, so decoding its payload (with aud/iss checks) is sufficient —
    // no signature verification needed.
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: requiredEnv("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: requiredEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
        redirect_uri: `${brokerOrigin(req)}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      throw new Error(`Google token exchange failed (${tokenRes.status}).`);
    }
    const { id_token: idToken } = (await tokenRes.json()) as { id_token?: string };
    if (!idToken) throw new Error("Google returned no id_token.");

    const claims = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"),
    ) as {
      aud?: string;
      iss?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (
      claims.aud !== requiredEnv("GOOGLE_OAUTH_CLIENT_ID") ||
      !["https://accounts.google.com", "accounts.google.com"].includes(claims.iss ?? "")
    ) {
      throw new Error("Google identity check failed.");
    }
    if (!claims.email || claims.email_verified !== true) {
      throw new Error("Your Google account has no verified email.");
    }

    const uid = await upsertFirebaseUser({
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
    });
    const customToken = await adminAuth().createCustomToken(uid);
    return backToApp({ token: customToken });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google sign-in failed.";
    return backToApp({ error: message });
  }
}
