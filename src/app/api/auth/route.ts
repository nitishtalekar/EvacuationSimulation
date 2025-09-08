import { NextRequest, NextResponse } from "next/server";

const HARDCODED_PASSWORD = "evacsim2025"; // change this

// POST for login
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === HARDCODED_PASSWORD) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    return res;
  }

  return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
}

// GET for session check
export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  if (session === "authenticated") {
    return NextResponse.json({ authenticated: true });
  } else {
    return NextResponse.json({ authenticated: false });
  }
}
