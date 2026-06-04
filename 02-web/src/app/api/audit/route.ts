import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "logs"; // "logs" or "metrics"
  const url = `http://127.0.0.1:8085/${type}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Audit Service returned ${response.status}` }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Audit Service unavailable: " + error.message },
      { status: 502 }
    );
  }
}
