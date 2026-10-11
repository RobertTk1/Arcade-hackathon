import "server-only";
import { arcade, ArcadeError } from "./client";

type CategorySummary = {
  categoryId: string;
  name: string;
  world: "print" | "jewelry";
  category?: { categoryId: string; name: string };
};

export type CategoryDetail = {
  categoryId: string;
  name: string;
  selections: Record<string, string>;
  canManufacture: boolean;
};

const NOTEBOOK = /notebook|journal/i;

export async function listPrintCategories() {
  const { items } = await arcade<{ items: CategorySummary[] }>("/categories/list", {});
  return items.filter((c) => c.world === "print");
}

/** Finds the notebook category by name and returns it with a complete default selection. */
export async function resolveNotebook(): Promise<CategoryDetail> {
  const categories = await listPrintCategories();
  const match = categories.find(
    (c) => NOTEBOOK.test(c.name) || (c.category && NOTEBOOK.test(c.category.name)),
  );
  if (!match) {
    throw new ArcadeError(
      404,
      `No notebook category found. Available: ${categories.map((c) => c.name).join(", ")}`,
    );
  }
  const detail = await arcade<CategoryDetail>("/categories/get", {
    categoryId: match.categoryId,
    selections: {},
  });
  if (!detail.canManufacture) {
    throw new ArcadeError(422, "The default notebook options can't be manufactured right now");
  }
  return detail;
}
