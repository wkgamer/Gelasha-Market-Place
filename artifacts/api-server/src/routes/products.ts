import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price as string),
    originalPrice: p.originalPrice ? parseFloat(p.originalPrice as string) : undefined,
    category: p.category,
    imageUrl: p.imageUrl,
    images: p.images || [],
    rating: parseFloat(p.rating as string),
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    brand: p.brand,
    discount: p.discount || 0,
  };
}

router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    let products = await db.select().from(productsTable);

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    res.json(products.map(formatProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const products = await db.select({ category: productsTable.category }).from(productsTable);
    const cats = ["All", ...new Set(products.map((p) => p.category))];
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, req.params.id));

    if (products.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(formatProduct(products[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
