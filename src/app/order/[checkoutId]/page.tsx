import { Suspense } from "react";
import Link from "next/link";
import { OrderStatus } from "@/components/OrderStatus";

export const metadata = { title: "Your order | COMO Journal Studio" };

// Reading params is runtime data, so it happens inside Suspense and the shell stays static.
async function Status({ params }: { params: PageProps<"/order/[checkoutId]">["params"] }) {
  const { checkoutId } = await params;
  return <OrderStatus checkoutId={checkoutId} />;
}

export default function OrderPage({ params }: PageProps<"/order/[checkoutId]">) {
  return (
    <main className="journal-studio">
      <header className="studio-header">
        <Link href="/" className="studio-brand" aria-label="COMO home"><span className="studio-brand-mark">co</span><span>Journal Studio</span></Link>
        <Link href="/design" className="studio-exit">Design another cover ↗</Link>
      </header>
      <div className="studio-content">
        <div className="studio-intro">
          <p className="studio-eyebrow">Your journal / Order</p>
          <h1>Your order</h1>
        </div>
        <Suspense fallback={<div className="studio-card order-card"><p className="studio-hint">Loading your order…</p></div>}>
          <Status params={params} />
        </Suspense>
      </div>
    </main>
  );
}
