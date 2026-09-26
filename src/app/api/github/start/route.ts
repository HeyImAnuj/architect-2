import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { authorizeUrl, githubConfigured } from "@/lib/github";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/auth", req.nextUrl.origin));
  if (!githubConfigured()) {
    return new NextResponse("Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET before connecting GitHub.", {
      status: 500,
    });
  }
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("github_oauth_state", `${user.id}.${state}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(authorizeUrl(req.nextUrl.origin, state));
}
