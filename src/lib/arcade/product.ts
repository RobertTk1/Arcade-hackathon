import "server-only";
import { arcade, ArcadeError } from "./client";

// Hackathon stand-in: Arcade has no notebook category, so the UI shows a notebook
// while the backend orders the closest flat, rectangular print product.
// Override with ARCADE_PRODUCT_CATEGORY (exact category name) to swap it.
const PREFERRED = ["Placemats", "Tea Towels", "Pocket Squares", "Table Runners"];

type CategorySummary = {
  categoryId: string;
  name: string;
  world: "print" | "jewelry";
};

export type CategoryDetail = {
  categoryId: string;
  name: string;
  selections: Record<string, string>;
  canManufacture: boolean;
};

export async function listPrintCategories() {
  const { items } = await arcade<{ items: CategorySummary[] }>("/categories/list", {});
  return items.filter((c) => c.world === "print");
}

/** Picks the stand-in category and returns it with a complete default selection. */
export async function resolveStandIn(): Promise<CategoryDetail> {
  const categories = await listPrintCategories();
  const wanted = process.env.ARCADE_PRODUCT_CATEGORY
    ? [process.env.ARCADE_PRODUCT_CATEGORY]
    : PREFERRED;

  for (const name of wanted) {
    const match = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!match) continue;
    const detail = await arcade<CategoryDetail>("/categories/get", {
      categoryId: match.categoryId,
      selections: {},
    });
    if (detail.canManufacture) return detail;
  }
  throw new ArcadeError(
    404,
    `No manufacturable stand-in product found. Available: ${categories.map((c) => c.name).join(", ")}`,
  );
}
