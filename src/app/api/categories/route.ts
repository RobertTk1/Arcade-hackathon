import { errorResponse } from "@/lib/arcade/client";
import { listPrintCategories } from "@/lib/arcade/notebook";

export async function GET() {
  try {
    const categories = await listPrintCategories();
    return Response.json({
      categories: categories.map((c) => ({
        categoryId: c.categoryId,
        name: c.name,
        group: c.category?.name ?? null,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
