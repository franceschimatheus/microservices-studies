import { NextResponse } from "next/server";

const INVENTORY_SERVICE_URL = "http://127.0.0.1:8086/inventory";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    const response = await fetch(`${INVENTORY_SERVICE_URL}/${productId}`, {
      // Prevent aggressive caching so we see real-time updates
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Inventory Service unavailable: " + error.message },
      { status: 502 }
    );
  }
}
