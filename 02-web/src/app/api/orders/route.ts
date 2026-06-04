import { NextResponse } from "next/server";

const ORDER_SERVICE_URL = "http://127.0.0.1:8081/orders";

/** Product price catalog — kept in sync with the Go inventory seed data */
const PRODUCT_PRICES: Record<string, number> = {
  prod_laptop: 999.0,
  prod_phone: 499.0,
  prod_headphones: 149.0,
};

/** Safely parse a response body as JSON, wrapping plain-text errors. */
async function safeJson(res: Response): Promise<{ data: unknown; ok: boolean }> {
  const text = await res.text();
  try {
    return { data: JSON.parse(text), ok: res.ok };
  } catch {
    return {
      data: { error: text.trim() || `upstream error ${res.status}` },
      ok: false,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Map frontend fields to Go domain fields:
    //   user_email  → customer_id  (email is the customer identifier in this sandbox)
    //   product_id  → product_id
    //   quantity    → quantity
    // Price is resolved server-side from the catalog so the client can't tamper it.
    const { user_email, product_id, quantity } = body as {
      user_email?: string;
      product_id?: string;
      quantity?: number;
    };

    if (!user_email || !product_id || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: user_email, product_id, quantity" },
        { status: 400 }
      );
    }

    const price = PRODUCT_PRICES[product_id] ?? 0;

    const response = await fetch(ORDER_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: user_email,
        product_id,
        quantity,
        price,
      }),
    });

    const { data, ok } = await safeJson(response);

    if (!ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: `Order Service unavailable: ${message}` },
      { status: 502 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/${id}`);
    const { data, ok } = await safeJson(response);

    if (!ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: `Order Service unavailable: ${message}` },
      { status: 502 }
    );
  }
}
