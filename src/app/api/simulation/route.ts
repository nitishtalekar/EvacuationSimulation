import { runSimulation } from "@/lib/simulation";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("[POST] /api/simulation called with body:", body);

  const stream = await runSimulation(body);

  // ✅ Wrap the ReadableStream in a proper Response
  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
