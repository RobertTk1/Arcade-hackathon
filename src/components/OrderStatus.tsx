"use client";

import { useEffect, useState } from "react";

type Order = {
  state: "paid";
  orderNumber: string;
  status: string;
  total: { amount: string; currency: string };
  lines: { title: string; selectionLabel: string; quantity: number; imageUrl: string | null }[];
  tracking: { company: string; url: string }[];
};
type Result = Order | { state: "awaiting_payment" };

const STEPS = ["Payment", "Order placed", "Being made", "On its way", "Delivered"];

// Arcade's statuses grouped into the five steps above.
function stepOf(status: string): number {
  if (status === "ordered") return 1;
  if (status === "shipped") return 3;
  if (status === "delivered" || status === "fulfilled") return 4;
  return 2; // cadReview, sampleReview, inProduction, inReview, inCorrection, approved, updatedInfo
}

const WAITING_MS = 4000; // Arcade rate-limits per IP: poll every 2 to 5 s
const PAID_MS = 20000;

export function OrderStatus({ checkoutId }: { checkoutId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      let next = WAITING_MS;
      try {
        const res = await fetch(`/api/orders/${checkoutId}`, { cache: "no-store" });
        const data = await res.json();
        if (stopped) return;
        if (!res.ok) throw new Error(data.error ?? "Couldn't load your order");
        setResult(data);
        setError(null);
        if (data.state === "paid") {
          if (["delivered", "fulfilled", "refunded"].includes(data.status)) return;
          next = PAID_MS;
        }
      } catch (e) {
        if (stopped) return;
        setError(e instanceof Error ? e.message : "Couldn't load your order");
        next = PAID_MS;
      }
      timer = setTimeout(check, next);
    }

    check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [checkoutId]);

  const order = result?.state === "paid" ? result : null;
  const step = order ? (order.status === "refunded" ? -1 : stepOf(order.status)) : 0;

  return (
    <div className="studio-card order-card" aria-live="polite">
      {order ? (
        <>
          <h2>{order.status === "refunded" ? "This order was refunded" : `Thank you. Order ${order.orderNumber}`}</h2>
          {order.status !== "refunded" && (
            <ol className="order-steps">
              {STEPS.map((label, i) => (
                <li key={label} className={i < step ? "done" : i === step ? "current" : undefined}>
                  <span aria-hidden="true">{i < step ? "✓" : i + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          )}
          <ul className="order-lines">
            {order.lines.map((l, i) => (
              <li key={i}>
                {l.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.imageUrl} alt="" />
                )}
                <div>
                  <strong>{l.title}</strong>
                  <span>{l.selectionLabel} · Qty {l.quantity}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="order-total">Total {order.total.amount} {order.total.currency}</p>
          {order.tracking.map((t) => (
            <a key={t.url} href={t.url} target="_blank" rel="noreferrer" className="studio-secondary">
              Track with {t.company} ↗
            </a>
          ))}
        </>
      ) : (
        <>
          <h2>Waiting for your payment</h2>
          <p className="studio-hint">
            Finish paying in the checkout tab we opened. This page updates by itself once the payment goes through.
            If you closed that tab, go back to <a href="/design" className="underline">your cover</a> and start checkout again.
          </p>
        </>
      )}
      <p className="studio-hint">
        Hackathon demo: this order is a placemat set printed with your cover, standing in for the notebook.
      </p>
      {error && <p role="alert" className="studio-error">{error} We’ll keep trying.</p>}
    </div>
  );
}
