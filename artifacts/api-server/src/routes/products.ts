import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import type { ProductVariant } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return "prod_" + Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

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
    variants: (p.variants as ProductVariant[]) || [],
    createdAt: p.createdAt,
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

router.post("/", async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, category,
      imageUrl, images, brand, inStock, discount, variants
    } = req.body;

    if (!name || !description || !price || !category || !imageUrl || !brand) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = generateId();
    const discountCalc = originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : (discount || 0);

    await db.insert(productsTable).values({
      id,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price).toFixed(2),
      originalPrice: originalPrice ? parseFloat(originalPrice).toFixed(2) : null,
      category: category.trim(),
      imageUrl: imageUrl.trim(),
      images: images || [],
      brand: brand.trim(),
      inStock: inStock !== false,
      discount: discountCalc,
      variants: variants || [],
      rating: "4.0",
      reviewCount: 0,
    });

    const created = await db.select().from(productsTable).where(eq(productsTable.id, id));
    res.json(formatProduct(created[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, category,
      imageUrl, images, brand, inStock, discount, variants
    } = req.body;

    const existing = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found" });

    const discountCalc = originalPrice && price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : (discount ?? existing[0].discount ?? 0);

    await db
      .update(productsTable)
      .set({
        name: name?.trim() ?? existing[0].name,
        description: description?.trim() ?? existing[0].description,
        price: price ? parseFloat(price).toFixed(2) : existing[0].price,
        originalPrice: originalPrice ? parseFloat(originalPrice).toFixed(2) : existing[0].originalPrice,
        category: category?.trim() ?? existing[0].category,
        imageUrl: imageUrl?.trim() ?? existing[0].imageUrl,
        images: images ?? existing[0].images,
        brand: brand?.trim() ?? existing[0].brand,
        inStock: inStock !== undefined ? inStock : existing[0].inStock,
        discount: discountCalc,
        variants: variants !== undefined ? variants : (existing[0].variants ?? []),
      })
      .where(eq(productsTable.id, req.params.id));

    const updated = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    res.json(formatProduct(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found" });

    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
