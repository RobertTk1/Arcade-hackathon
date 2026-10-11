import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, API_URL } from "@/lib/como/api";

type Product = {
  productId: string;
  title: string;
  selectionLabel: string;
  imageUrl: string;
  unitPrice: { amount: string; currency: string } | null;
};

type ProductPoll =
  { status: "running" } | { status: "failed"; error: string } | ({ status: "succeeded" } & Product);

type Step =
  | { kind: "building" }
  | { kind: "ready"; product: Product }
  | { kind: "checkout"; product: Product; checkoutId: string; checkoutUrl: string }
  | { kind: "error"; message: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function price(p: Product["unitPrice"]) {
  if (!p) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: p.currency }).format(
    Number(p.amount),
  );
}

/**
 * Builds the Arcade product for the current artwork and opens Arcade checkout.
 * Arcade has no notebook, so the product is the stand-in print item chosen by
 * the API (see docs/arcade-flow.md). Only the artwork is printed.
 */
export function OrderDialog({
  open,
  onOpenChange,
  patternId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patternId: string;
}) {
  const [step, setStep] = useState<Step>({ kind: "building" });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStep({ kind: "building" });
    (async () => {
      try {
        const { jobId } = await api<{ jobId: string }>("/api/products", { body: { patternId } });
        for (;;) {
          await wait(3000);
          if (cancelled) return;
          const job = await api<ProductPoll>(`/api/products/${encodeURIComponent(jobId)}`);
          if (job.status === "failed") throw new Error(job.error);
          if (job.status === "succeeded") {
            setStep({ kind: "ready", product: job });
            return;
          }
        }
      } catch (e) {
        if (!cancelled) setStep({ kind: "error", message: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, patternId]);

  const checkout = async (product: Product) => {
    // Open the tab inside the click handler or the browser blocks it.
    const tab = window.open("", "_blank");
    try {
      const c = await api<{ checkoutId: string; checkoutUrl: string }>("/api/checkouts", {
        body: { productId: product.productId },
      });
      if (tab) tab.location.href = c.checkoutUrl;
      else window.location.href = c.checkoutUrl;
      setStep({ kind: "checkout", product, ...c });
    } catch (e) {
      tab?.close();
      setStep({ kind: "error", message: (e as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            Order your cover art
          </DialogTitle>
          <DialogDescription>
            We print your artwork on the closest item our maker offers. Your title and stickers stay
            in the preview and aren't printed.
          </DialogDescription>
        </DialogHeader>

        {step.kind === "building" && (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your item. This usually takes under a minute.
          </p>
        )}

        {(step.kind === "ready" || step.kind === "checkout") && (
          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl bg-card p-3">
              <img
                src={step.product.imageUrl}
                alt={step.product.title}
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p className="font-medium">{step.product.title}</p>
                <p className="text-xs text-muted-foreground">{step.product.selectionLabel}</p>
                {price(step.product.unitPrice) && (
                  <p className="mt-2 font-serif text-lg">{price(step.product.unitPrice)}</p>
                )}
              </div>
            </div>
            {step.kind === "ready" ? (
              <Button className="h-11 w-full rounded-full" onClick={() => checkout(step.product)}>
                Continue to checkout
              </Button>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Checkout opened in a new tab. Payment happens there.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" className="rounded-full">
                    <a href={step.checkoutUrl} target="_blank" rel="noreferrer">
                      Open checkout <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button asChild className="rounded-full">
                    <a
                      href={`${API_URL}/order/${encodeURIComponent(step.checkoutId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Track my order <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step.kind === "error" && (
          <div className="space-y-3 py-2 text-sm">
            <p>{step.message}</p>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
