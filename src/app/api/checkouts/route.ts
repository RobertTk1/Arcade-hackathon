import { arcade, errorResponse } from "@/lib/arcade/client";

export async function POST(req: Request) {
  try {
    const { productId, quantity = 1, requestId } = await req.json();
    if (typeof productId !== "string" || !Number.isInteger(quantity) || quantity < 1) {
      return Response.json({ error: "productId and a positive quantity are required" }, { status: 400 });
    }
    const checkout = await arcade<{ checkoutId: string; checkoutUrl: string }>("/checkouts/create", {
      requestId: typeof requestId === "string" ? requestId : crypto.randomUUID(),
      lines: [{ productId, quantity }],
      // Arcade requires dropShip for single-quantity lines without a subscription.
      dropShip: quantity === 1,
    });
    return Response.json(checkout);
  } catch (e) {
    return errorResponse(e);
  }
}
