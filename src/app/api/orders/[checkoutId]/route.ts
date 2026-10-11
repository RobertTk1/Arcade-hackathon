import { arcade, ArcadeError, errorResponse } from "@/lib/arcade/client";

type Money = { amount: string; currency: string };

type Order = {
  orderNumber: string;
  status: string;
  placedAt: string;
  total: Money;
  lines: { title: string; selectionLabel: string; quantity: number; imageUrl: string | null }[];
  tracking: { company: string; url: string }[];
};

// Arcade answers 404 until the checkout is paid. Checkout IDs are plain numbers, so
// only fields safe to show to anyone holding the link are returned (no address, no
// maker, no tracking number).
export async function GET(_req: Request, ctx: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await ctx.params;
  if (!/^\d+$/.test(checkoutId)) {
    return Response.json({ error: "Invalid checkout" }, { status: 400 });
  }
  try {
    const o = await arcade<Order>("/orders/get", { checkoutId });
    return Response.json({
      state: "paid",
      orderNumber: o.orderNumber,
      status: o.status,
      placedAt: o.placedAt,
      total: o.total,
      lines: o.lines.map((l) => ({
        title: l.title,
        selectionLabel: l.selectionLabel,
        quantity: l.quantity,
        imageUrl: l.imageUrl,
      })),
      tracking: o.tracking.map((t) => ({ company: t.company, url: t.url })),
    });
  } catch (e) {
    if (e instanceof ArcadeError && e.status === 404) {
      return Response.json({ state: "awaiting_payment" });
    }
    return errorResponse(e);
  }
}
